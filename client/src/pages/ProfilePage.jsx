import React, { useContext, useState } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser ? authUser.fullName : '');
  const [bio, setBio] = useState(authUser ? authUser.bio : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      let dataToSend = { fullName: name, bio };
  
      if (selectedImg) {
        const reader = new FileReader();
        reader.onload = async () => {
          dataToSend.profilePic = reader.result;
  
          await updateProfile(dataToSend); // we assume this handles toast and error
          navigate("/", { replace: true });
        };
        reader.readAsDataURL(selectedImg);
      } else {
        await updateProfile(dataToSend);
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update profile");
    }
  };
  

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col reverse rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile Details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e) => setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden />
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} alt="avatar" className={`w-12 h-12 ${selectedImg && 'rounded-full'}`} />
            Upload Profile Image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder='Your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} required placeholder='Write Profile bio' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}></textarea>
          <button type="submit" className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer'>Save</button>
        </form>
        <img src={ authUser?.profilePic || assets.logo_icon} className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && 'rounded-full'}`} alt="logo" />
      </div>
    </div>
  );
};

export default ProfilePage;
