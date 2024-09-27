import UserNav from "./UserNav.js";

export default {
  name: 'UserProfile',
  components: {
    UserNav
  },
  data() {
      return {
          profile: null,
          errorMessage: ''
      };
  },
  methods: {
      async fetchUserProfile() {
          try {
              const token = localStorage.getItem('auth_token');
              console.log('Token:', token); // Debug: Check if the token is present

              const response = await fetch('http://127.0.0.1:5000/api/user-profile', {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authentication-Token': token // Use Authentication-Token header
                  },
              });

              if (response.ok) {
                  const data = await response.json();
                  this.profile = data;
              } else {
                  const errorData = await response.json();
                  this.errorMessage = errorData.message || 'Failed to fetch profile.';
              }
          } catch (error) {
              console.error('Error:', error);
              this.errorMessage = 'An error occurred while fetching profile.';
          }
      }
  },
  created() {
      this.fetchUserProfile();
  },
  template: `
  <div>
      <UserNav />
      <div class="container mt-5">
          <div class="row">
              <div class="col-md-6 offset-md-3">
                  <div class="card">
                      <div class="card-header bg-primary text-white">
                          <h4>User Profile</h4>
                      </div>
                      <div class="card-body">
                          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
                          <div v-if="profile">
                              <div class="mb-3">
                                  <label for="email" class="form-label"><strong>Email:</strong></label>
                                  <p id="email">{{ profile.email }}</p>
                              </div>
                              <div class="mb-3">
                                  <label for="name" class="form-label"><strong>Name:</strong></label>
                                  <p id="name">{{ profile.name }}</p>
                              </div>
                              <!-- Add more profile fields as needed -->
                          </div>
                          <div v-if="!profile && !errorMessage" class="text-center">
                              <p>Loading profile...</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
  `,
};
