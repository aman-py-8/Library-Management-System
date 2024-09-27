import UserNav from "./UserNav.js";

export default {
  name: 'UserDashboard',
  components: {
    UserNav
  },
  data() {
    return {
      availableBooks: [], // Array to store available books
      feedbackText: '', // Textarea model for feedback
      rating: 1, // Rating model (default is 1)
      errorMessage: '',
      successMessage: '',
    };
  },
  created() {
    this.fetchBooks();
  },
  methods: {
    async fetchBooks() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          this.errorMessage = 'User is not authenticated. Please login.';
          return;
        }

        const response = await fetch('http://127.0.0.1:5000/api/ebooks?include_rating=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          this.availableBooks = await response.json();
        } else {
          this.errorMessage = 'Failed to fetch available books.';
        }
      } catch (error) {
        console.error('Error:', error);
        this.errorMessage = 'An error occurred. Please try again.';
      }
    },

    async requestBook(bookId) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.errorMessage = 'User is not authenticated. Please login.';
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/request-ebook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ebook_id: bookId }),
        });

        if (response.ok) {
          this.successMessage = 'Book requested successfully!';
          this.errorMessage = '';
          this.fetchBooks(); // Refresh book list
        } else {
          const errorData = await response.json();
          this.errorMessage = errorData.message || 'Request failed.';
          this.successMessage = '';
        }
      } catch (error) {
        console.error('Error:', error);
        this.errorMessage = 'An error occurred. Please try again.';
        this.successMessage = '';
      }
    },

    async submitRatingAndReview(bookId) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.errorMessage = 'User is not authenticated. Please login.';
        return;
      }
    
      if (this.rating < 1 || this.rating > 5) {
        this.errorMessage = 'Rating must be between 1 and 5.';
        return;
      }
    
      try {
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ebook_id: bookId, rating: this.rating, review: this.feedbackText }),
        });
    
        if (response.ok) {
          this.successMessage = 'Rating and review submitted successfully!';
          this.errorMessage = '';
          this.feedbackText = ''; // Clear feedback textarea
          this.rating = 1; // Reset rating
        } else {
          const errorData = await response.json();
          this.errorMessage = errorData.message || 'Submission failed.';
          this.successMessage = '';
        }
      } catch (error) {
        console.error('Error:', error);
        this.errorMessage = 'An error occurred. Please try again.';
        this.successMessage = '';
      }
    }
    
  },
  template: `
    <div style="
      background-image: url('/static/img.jpg'); 
       
      background-size: cover; 
      background-position: center; 
       
       
       
      
    ">
      <UserNav />
      <div class="container mt-4">
        <h1 class="mb-4">User Dashboard</h1>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <h2 class="mb-3">Available Books</h2>
        <div class="row">
          <div class="col-sm-6 mb-4" v-for="book in availableBooks" :key="book.id">
            <div class="card h-100">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">
                  {{ book.name }}
                  <small class="text-muted" v-if="book.average_rating"> (Avg. Rating: {{ book.average_rating }})</small>
                </h5>
                <p class="card-text"><small class="text-muted">Authors: {{ book.authors }}</small></p>
                <button class="btn btn-primary mt-auto" @click="requestBook(book.id)">Request Book</button>
              </div>
              <div class="card-footer">
                <h6>Rate and Review</h6>
                <div class="form-group mb-2">
                  <label for="rating">Rating (1-5):</label>
                  <input type="number" id="rating" v-model="rating" min="1" max="5" class="form-control" />
                </div>
                <textarea class="form-control mb-2" v-model="feedbackText" placeholder="Write your review here..."></textarea>
                <button class="btn btn-secondary" @click="submitRatingAndReview(book.id)">Submit Rating and Review</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  style: `
    .form-group {
      margin-bottom: 15px;
    }
  `
};
