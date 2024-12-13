<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import ProfileHeader from '@/components/ProfileHeader.vue';

const user = ref({
  username: '',
  email: '',
  password: '',
  profilePhoto: '',
});

const userPosts = ref([]);
const baseUrl = 'http://localhost:3000'; // Base URL for API
const isEditModalOpen = ref(false);
const editPostData = ref({
  title: '',
  content: '',
  category_name: '',
  image_urls: [],
  post_id: null,
});

// Handle file upload for profile photo
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    user.value.profilePhoto = file; // Store the file for upload
  }
};

// Fetch user profile and posts
onMounted(async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    user.value = response.data.user; // Populate user data
    userPosts.value = response.data.posts.map((post) => {
      const imageUrls = post.image_url
        ? post.image_url.split(',').map((url) => `${baseUrl}${url.trim()}`)
        : []; // Split and prefix URLs
      return {
        ...post,
        currentImageUrl: imageUrls[0] || '/default-post-image.png', // Default image if none provided
        imageUrls, // Store all image URLs for future use if needed
      };
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    Swal.fire('Error', 'Failed to load user profile.', 'error');
  }
});

// Update user profile
const updateProfile = async () => {
  const formData = new FormData();
  
  // Append only the fields that have values
  if (user.value.username) {
    formData.append('username', user.value.username);
  }
  if (user.value.email) {
    formData.append('email', user.value.email);
  }
  if (user.value.password) {
    formData.append('password', user.value.password); // Append the password if provided
  }
  if (user.value.profilePhoto) {
    formData.append('profilePhoto', user.value.profilePhoto); // Append the file if provided
  }

  try {
    await axios.put(`${baseUrl}/api/profile`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    Swal.fire('Success', 'Profile updated successfully!', 'success');
    window.location.reload();
  } catch (error) {
    console.error('Error updating profile:', error);
    Swal.fire('Error', 'Failed to update profile.', 'error');
  }
};

// Open the edit modal and populate the data
const openEditModal = (post) => {
  editPostData.value = {
    title: post.title,
    content: post.content,
    category_name: post.category_name,
    image_urls: post.imageUrls,
    post_id: post.post_id,
  };
  isEditModalOpen.value = true;
};

// Close the edit modal
const closeEditModal = () => {
  isEditModalOpen.value = false;
  editPostData.value = {
    title: '',
    content: '',
    category_name: '',
    image_urls: [],
    post_id: null,
  };
};

// Handle image uploads for posts
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  editPostData.value.image_urls = files.map((file) => URL.createObjectURL(file)); // Preview URLs
};

// Submit the edited post
const submitEditPost = async () => {
  try {
    const formData = new FormData();
    formData.append('title', editPostData.value.title);
    formData.append('content', editPostData.value.content);
    formData.append('category_name', editPostData.value.category_name);
    editPostData.value.image_urls.forEach((image) => {
      formData.append('images', image); // Append each image file
    });

    await axios.put(`${baseUrl}/api/posts/${editPostData.value.post_id}`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    Swal.fire('Success', 'Post updated successfully!', 'success');
    window.location.reload(); 
    closeEditModal(); // Close the modal after successful update
  } catch (error) {
    console.error('Error updating post:', error);
    Swal.fire('Error', 'Failed to update post.', 'error');
  }
};

// Delete post
const deletePost = async (postId) => {
  // Show a confirmation dialog before deleting
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'You will not be able to recover this post!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  // If the user confirms, proceed with the deletion
  if (result.isConfirmed) {
    try {
      const response = await axios.delete(`${baseUrl}/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.message === 'Post deleted successfully') {
        userPosts.value = userPosts.value.filter((post) => post.post_id !== postId);
        Swal.fire('Deleted', 'Post deleted successfully!', 'success');
      } else {
        Swal.fire('Error', 'Failed to delete post.', 'error');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to delete post.', 'error');
    }
  }
};

</script>


<template>
  <section class="">
    <div class="container mx-auto mt-6 p-4 sm:p-6">
    <ProfileHeader />
  </div>
   <!-- User Posts Section -->
   <div class=" p-6 rounded-xl">
    <!-- Header -->
    <div class="mb-16">
      <h2 class="text-3xl font-extrabold text-white text-center">Your Destinations</h2>
    </div>

    <!-- Posts Grid -->
    <div class="max-w-7xl mx-auto px-6 animate-fade-in">
      <!-- Empty State -->
      <div v-if="userPosts.length === 0" class="text-center text-gray-300 text-lg">
        <i class="fas fa-info-circle"></i> No posts found. Start creating your first post!
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Post Card -->
        <div 
          v-for="post in userPosts" 
          :key="post.post_id" 
          class="bg-white border border-gray-200 rounded-lg shadow-md shadow-black hover:shadow-lg hover:shadow-black transition-shadow duration-300 overflow-hidden"
        >
          <!-- Post Image -->
          <img 
            :src="post.currentImageUrl" 
            :alt="post.title" 
            class="object-cover w-full h-48 rounded-t-lg transition-transform duration-300 hover:scale-105"
          />

          <!-- Post Content -->
          <div class="p-4 space-y-2">
            <RouterLink 
              :to="`/posts/${post.post_id}`" 
              class="text-lg font-extrabold text-teal-700 truncate hover:text-teal-600 transition-colors font-serif"
            >
              {{ post.title }}
            </RouterLink>
            <p class="text-sm font-semibold italic text-gray-600 line-clamp-1">
              {{ post.content }}
            </p>
            <p class="bg-teal-600 w-20 rounded-full text-sm font-semibold italic text-white line-clamp-1">
              {{ post.destination }}
            </p>
            <router-link
            :to="`/posts/${post?.post_id}`"
            class="flex justify-end items-center font-semibold"
          >
            <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i> View
          </router-link>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between px-4 py-2 bg-gray-100 border-t border-gray-200">
            <button 
              @click="openEditModal(post)" 
              class="flex items-center gap-2 text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
            >
              <i class="fas fa-edit"></i> Edit
            </button>
            <button 
              @click="deletePost(post.post_id)" 
              class="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
            >
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Edit Post Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4">Edit Post</h2>
        <form @submit.prevent="submitEditPost">
          <div class="mb-4">
            <label for="editTitle" class="block text-sm font-medium text-gray-700">Title</label>
            <input
              v-model="editPostData.title"
              type="text"
              id="editTitle"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 p-2"
              required
            />
          </div>
          <div class="mb-4">
            <label for="editContent" class="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              v-model="editPostData.content"
              id="editContent"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 p-2"
              rows="3"
              required
            ></textarea>
          </div>
          <div class="mb-4">
            <label for="editCategory" class="block text-sm font-medium text-gray-700">Category Name</label>
            <select
              v-model="editPostData.category_name"
              id="editCategory"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 p-2"
              required
            >
              <option value="" disabled>Select a category</option>
              <option value="Cityscape">Cityscape</option>
              <option value="Landscape">Landscape</option>
              <option value="Seascape">Seascape</option>
            </select>
          </div>
          <!-- <div class="mb-4">
            <label for="editImages" class="block text-sm font-medium text-gray-700">Images</label>
            <input
              type="file"
              id="editImages"
              @change="handleImageUpload"
              multiple
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 p-2"
            />
          </div> -->
          <button
            type="submit"
            class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Save Changes
          </button>
          <button
            type="button"
            @click="closeEditModal"
            class="ml-2 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  </section>
</template>