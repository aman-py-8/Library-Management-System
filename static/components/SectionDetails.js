import Navbar from "./Navbar.js";

export default {
  name: 'SectionDetails',
  components: {
    Navbar
  },
  data() {
    return {
      section: null,
      books: [],
      bookName: '',
      bookContent: '',
      bookAuthors: '',
      errorMessage: '',
      successMessage: '',
      isEditingBook: false,
      editBookId: null,
      editBookName: '',
      editBookContent: '',
      editBookAuthors: '',
      editSection: ''
    };
  },
  methods: {
    async fetchSectionAndBooks() {
      const sectionId = this.$route.params.id;

      try {
        // Fetch section details from the API
        const sectionResponse = await fetch(`/api/sections/${sectionId}`);
        if (!sectionResponse.ok) throw new Error('Failed to fetch section details');
        this.section = await sectionResponse.json();

        // Fetch books in the section from the API
        const booksResponse = await fetch(`/api/ebooks?section_id=${sectionId}`);
        if (!booksResponse.ok) throw new Error('Failed to fetch books');
        this.books = await booksResponse.json();
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async addBook() {
      const sectionId = this.$route.params.id;

      try {
        const response = await fetch(`/api/ebooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.bookName,
            content: this.bookContent,
            authors: this.bookAuthors,
            section_id: sectionId  // Ensure the section_id is included
          }),
        });

        if (!response.ok) throw new Error('Failed to add book');
        
        const data = await response.json();
        this.successMessage = 'Book added successfully!';
        this.fetchSectionAndBooks(); // Refresh section and books
        this.bookName = '';
        this.bookContent = '';
        this.bookAuthors = '';
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    editBook(book) {
      this.isEditingBook = true;
      this.editBookId = book.id;
      this.editBookName = book.name;
      this.editBookContent = book.content;
      this.editBookAuthors = book.authors;
      this.editSection = book.section_id
    },
    async updateBook() {
      try {
        const response = await fetch(`/api/ebooks/${this.editBookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.editBookName,
            content: this.editBookContent,
            authors: this.editBookAuthors,
            section_id: this.editSection
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(`Failed to update book: ${errorData.message || response.statusText}`);
        }

        this.successMessage = 'Book updated successfully!';
        this.fetchSectionAndBooks(); // Refresh section and books
        this.isEditingBook = false;
        this.editBookId = null;
        this.editBookName = '';
        this.editBookContent = '';
        this.editBookAuthors = '';
        this.editSection ='';
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    cancelEdit() {
      this.isEditingBook = false;
      this.editBookId = null;
      this.editBookName = '';
      this.editBookContent = '';
      this.editBookAuthors = '';
      this.editSection = '';
    },
    async deleteBook(bookId) {
      try {
        const response = await fetch(`/api/ebooks/${bookId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete book');

        this.successMessage = 'Book deleted successfully!';
        this.fetchSectionAndBooks(); // Refresh section and books
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  },
  created() {
    this.fetchSectionAndBooks();
  },
  template: `
    <div>
      <Navbar />
      <div class="container mt-4">
        <h1>{{ section ? section.name : 'Loading...' }}</h1>
        <p>{{ section ? section.description : '' }}</p>
        
        <div class="card my-4">
          <div class="card-body">
            <h2 class="card-title">Add a New Book</h2>
            <form @submit.prevent="addBook">
              <div class="form-group">
                <label for="book-name">Book Name:</label>
                <input type="text" id="book-name" class="form-control" v-model="bookName" required>
              </div>
              <div class="form-group">
                <label for="book-content">Content:</label>
                <textarea id="book-content" class="form-control" v-model="bookContent" required></textarea>
              </div>
              <div class="form-group">
                <label for="book-authors">Authors:</label>
                <input type="text" id="book-authors" class="form-control" v-model="bookAuthors" required>
              </div>
              <button type="submit" class="btn btn-primary">Add Book</button>
            </form>
            <p v-if="errorMessage" class="mt-2 text-danger">{{ errorMessage }}</p>
            <p v-if="successMessage" class="mt-2 text-success">{{ successMessage }}</p>
          </div>
        </div>

        <h2>Books in This Section</h2>
        <div class="row">
          <div class="col-sm-6 mb-3" v-for="book in books" :key="book.id">
            <div class="card h-100">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">{{ book.name }}</h5>
                <p class="card-text">{{ book.content }}</p>
                <p class="card-text"><small class="text-muted">Authors: {{ book.authors }}</small></p>
                <div class="mt-auto">
                  <button class="btn btn-warning me-2" @click="editBook(book)">Edit</button>
                  <button class="btn btn-danger" @click="deleteBook(book.id)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isEditingBook" class="card mt-4">
          <div class="card-body">
            <h3 class="card-title">Edit Book</h3>
            <form @submit.prevent="updateBook">
              <div class="form-group">
                <label for="edit-book-name">Book Name:</label>
                <input type="text" id="edit-book-name" class="form-control" v-model="editBookName" required>
              </div>
              <div class="form-group">
                <label for="edit-book-content">Content:</label>
                <textarea id="edit-book-content" class="form-control" v-model="editBookContent" required></textarea>
              </div>
              <div class="form-group">
                <label for="edit-book-section">Section:</label>
                <textarea id="edit-book-section" class="form-control" v-model="editSection" required></textarea>
              </div>
              <div class="form-group">
                <label for="edit-book-authors">Authors:</label>
                <input type="text" id="edit-book-authors" class="form-control" v-model="editBookAuthors" required>
              </div>
              <button type="submit" class="btn btn-primary">Update Book</button>
              <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
            </form>
            <p v-if="errorMessage" class="mt-2 text-danger">{{ errorMessage }}</p>
            <p v-if="successMessage" class="mt-2 text-success">{{ successMessage }}</p>
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
