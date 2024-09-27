import UserNav from "./UserNav.js";
export default {
    name: 'MyBooks',
    components: {
      UserNav
    },
    data() {
      return {
        grantedBooks: [], // This will store the list of granted books
        errorMessage: '', // This will store any error message
        successMessage: '', // This will store the success message
        userId: null,
      };
    },
    created() {
      this.fetchGrantedBooks(); // Fetch granted books when the component is created
      this.userId = localStorage.getItem('user_id');
    },
    methods: {
      async fetchGrantedBooks() {
        try {
            const response = await fetch('/api/granted_books', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Include token if required
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Granted Books Data:', data); // Log the data
                this.grantedBooks = data; // Assign the fetched data to grantedBooks
            } else {
                const errorData = await response.json();
                this.errorMessage = errorData.message || 'Failed to fetch granted books.';
            }
        } catch (error) {
            console.error('Error:', error);
            this.errorMessage = 'An error occurred while fetching granted books.';
        }
      },
      async returnBook(bookId) {
          try {
              if (!this.userId) {
                  throw new Error('User ID is not available');
              }
  
              const response = await fetch(`/api/return-book/${bookId}`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ user_id: this.userId }),
              });
  
              if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Error response:', errorText);
                  throw new Error('Failed to return book');
              }
  
              // Clear the success message and update the grantedBooks list
              this.successMessage = 'Book returned successfully!';
              this.grantedBooks = this.grantedBooks.filter(book => book.id !== bookId);
          } catch (error) {
              console.error('Error:', error.message);
              this.errorMessage = error.message;
          }
      },
      viewBook(bookId) {
        this.$router.push(`/book/${bookId}`); // Redirect to book view page
      }
    },
    template: `
    <div>
      <UserNav />
      <div class="container">
      
        <h1>My Books</h1>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <ul class="list-group">
          <li v-for="book in grantedBooks" :key="book.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <h5>{{ book.ebook.name }}</h5>
              <p>{{ book.ebook.author }}</p>
            </div>
            <div>
              <button class="btn btn-primary" @click="viewBook(book.ebook.id)">View</button>
              <button class="btn btn-danger" @click="returnBook(book.id)">Return</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    `,
  };
  