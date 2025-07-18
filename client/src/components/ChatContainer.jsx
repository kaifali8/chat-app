import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';


const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages
  } = useContext(ChatContext);

  const { authUser, onlineUsers, socket } = useContext(AuthContext);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const scrollEnd = useRef();
  const typingTimeoutRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const payload = {};

    if (selectedFile) {
      payload.file = filePreview;
      payload.fileType = selectedFile.type;
    } else if (input.trim()) {
      payload.text = input.trim();
    } else return;

    socket.emit('stopTyping', {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });

    await sendMessage(payload);
    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!(
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type === 'application/pdf'
    )) {
      toast.error('Unsupported file type');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.on('typing', ({ senderId }) => senderId === selectedUser._id && setIsTyping(true));
    socket.on('stopTyping', ({ senderId }) => senderId === selectedUser._id && setIsTyping(false));
    return () => {
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  useEffect(() => {
    if (!scrollEnd.current) return;
    scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500" />}
        </p>
        <img src={assets.arrow_icon} alt="" className="md:hidden w-7 cursor-pointer" onClick={() => setSelectedUser(null)} />
        <img src={assets.help_icon} alt="" className="max-md:hidden w-5" />
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-160px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === authUser._id;
          return (
            <div key={i} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-end flex-row-reverse'}`}>
              {msg.file ? (
                msg.fileType.startsWith('image/') ? (
                  <img src={msg.file} className="max-w-[230px] mb-8" alt="file" />
                ) : msg.fileType.startsWith('video/') ? (
                  <video src={msg.file} controls className="max-w-[230px] mb-8" />
                ) : msg.fileType === 'application/pdf' ? (
                  <embed src={msg.file} type="application/pdf" width="200px" className="mb-8" />
                ) : null
              ) : (
                <p className={`p-2 max-w-[300px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                  {msg.text}
                </p>
              )}
              <div className="text-center text-xs">
                <img src={isOwn ? authUser.profilePic : selectedUser.profilePic || assets.avatar_icon} className="w-8 rounded-full" alt="" />
                <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {isTyping && <p className="text-gray-400 italic mb-2 ml-2">{selectedUser.fullName} is typing...</p>}
        <div ref={scrollEnd} />
      </div>

      {/* Input & Actions */}
      <div className="absolute bottom-0 w-full flex items-center gap-3 p-3 bg-gray-900" onClick={() => setShowEmojiPicker(false)} >
      {showEmojiPicker && (
  <div
    className="absolute bottom-20 left-4 z-50 bg-[#1e1e1e] rounded-lg shadow-lg p-1"
    onClick={(e) => e.stopPropagation()} // prevent closing when clicked inside
  >
    <EmojiPicker theme="dark" onEmojiClick={(e) => setInput((prev) => prev + e.emoji)}
      searchDisabled skinTonesDisabled/>
  </div>
)}

        <button
          onClick={(e) => { e.stopPropagation(); // so it doesn’t auto-close on click
         setShowEmojiPicker((prev) => !prev);}} className="text-white">😊</button>
        <label htmlFor="file-upload">
          <img src={assets.gallery_icon} alt="attach" className="w-5 cursor-pointer" />
        </label>
        <input id="file-upload" type="file" accept="image/*,video/*,application/pdf" hidden onChange={handleFileSelect} />

        {filePreview && (
          <div className="preview absolute bottom-16 left-4 bg-gray-700 p-2 rounded-lg">
            {selectedFile.type.startsWith('image/') && <img src={filePreview} className="max-w-xs" alt="preview" />}
            {selectedFile.type.startsWith('video/') && <video src={filePreview} controls className="max-w-xs" />}
            {selectedFile.type === 'application/pdf' && <embed src={filePreview} type="application/pdf" width="200px" />}
            <button onClick={() => { setSelectedFile(null); setFilePreview(null); }}>✕</button>
          </div>
        )}

        <input value={input} onChange={(e) => {
          setInput(e.target.value);
          socket.emit('typing', { senderId: authUser._id, receiverId: selectedUser._id });
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { senderId: authUser._id, receiverId: selectedUser._id });
          }, 2000);
        }} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
         placeholder="Type a message" className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white" />

        <button onClick={handleSendMessage}>
          <img src={assets.send_button} alt="send" className="w-7" />
        </button>
      </div>
    </div>
  ) : (
    <div className="h-full flex items-center justify-center text-gray-400">Select a chat</div>
  );
};

export default ChatContainer;
