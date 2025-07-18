import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const selectedUserRef = useRef(null);

    const { socket, axios } = useContext(AuthContext);

    // 🧠 Get all users and unseen messages for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 💬 Get messages with selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🚀 Send message to selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 🔔 Socket listener for incoming messages
    useEffect(() => {
        if (!socket) return;
      
        const handleNewMessage = (newMessage) => {
            console.log("📥 New incoming message:", newMessage); 
          const selectedId = selectedUserRef.current?._id || localStorage.getItem("selectedUserId");
      
          const isChatOpen =
  selectedUserRef.current &&
  (
    newMessage.senderId === selectedUserRef.current._id ||
    newMessage.receiverId === selectedUserRef.current._id
  );
      
          if (isChatOpen) {
            newMessage.seen = true;
            setMessages((prevMessages) => {
              const alreadyExists = prevMessages.some(
                (msg) => msg._id === newMessage._id
              );
              return alreadyExists ? prevMessages : [...prevMessages, newMessage];
            });
            axios.put(`/api/messages/mark/${newMessage._id}`);
          } else {
            setUnseenMessages((prev) => ({
              ...prev,
              [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
            }));
          }
        };
      
        socket.on("NewMessage", handleNewMessage);
      
        return () => {
          socket.off("NewMessage", handleNewMessage);
        };
      }, [socket]); //
      

      useEffect(() => {
        const storedId = localStorage.getItem("selectedUserId");
      
        if (storedId && users.length > 0) {
          const matchedUser = users.find((u) => u._id === storedId);
          if (matchedUser) {
            setSelectedUser(matchedUser);
            getMessages(matchedUser._id); // 🔥 this was missing
          }
        }
      }, [users]);
        
        useEffect(() => {
            selectedUserRef.current = selectedUser;
          }, [selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        setUsers,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
