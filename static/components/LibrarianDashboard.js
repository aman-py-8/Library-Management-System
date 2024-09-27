import Navbar from "./Navbar.js";

export default {
  name: 'LibrarianDashboard',
  components: {
    Navbar
  },
  data() {
    return {
      sectionName: '',
      sectionDescription: '',
      sectionMessage: '',
      sections: [],
      editingSection: null,
      editMessage: '',
      editError: '',
      successMessage: '',
      errorMessage: ''
    };
  },
  methods: {
    async addSection() {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: this.sectionName,
          description: this.sectionDescription
        }),
      });
      const data = await response.json();
      if (response.ok) {
        this.sectionMessage = 'Section added successfully!';
        this.fetchSections();
        this.sectionName = '';
        this.sectionDescription = '';
      } else {
        this.sectionMessage = 'Failed to add section.';
      }
    },
    async download() {
      const response = await fetch('/download-csv');
      if (response.status === 200) {
          const response_data = await response.json();
          const taskid = response_data['taskid'];
          const intv = setInterval(async () => {
              const response = await fetch(`getcsv/${taskid}`);
              if (response.status === 200) {
                  clearInterval(intv);
                  window.location.href = `getcsv/${taskid}`;
              } else {
                  alert("Unable to download");
              }
          }, 1000);
      } else {
          alert("Unable to download");
      }
    },
    async fetchSections() {
      const response = await fetch('/api/sections');
      this.sections = await response.json();
    },
    async deleteSection(sectionId) {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        this.successMessage = 'Section deleted successfully!';
        this.fetchSections(); // Refresh section list
      } else {
        this.errorMessage = 'Failed to delete section.';
      }
    },
    viewSection(sectionId) {
      // Navigate to a detailed view of the section
      this.$router.push(`/sections/${sectionId}`);
    },
    editSection(section) {
      this.editingSection = { ...section };
      this.editMessage = '';
      this.editError = '';
    },
    async updateSection() {
      if (!this.editingSection) return;

      const response = await fetch(`/api/sections/${this.editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.editingSection),
      });

      if (response.ok) {
        this.editMessage = 'Section updated successfully!';
        this.fetchSections(); // Refresh section list
        this.editingSection = null; // Clear the edit form
      } else {
        const data = await response.json();
        this.editError = `Failed to update section: ${data.message}`;
      }
    },
    cancelEdit() {
      this.editingSection = null;
      this.editMessage = '';
      this.editError = '';
    }
  },
  created() {
    this.fetchSections();
  },
  template: `
    <div style="background-color: #fc7878;">
      <Navbar />
      <div class="container mt-4">
        <h1 class="mb-4">Librarian Dashboard</h1>
        <!-- Section form -->
        <div class="card mb-4">
          <div class="card-body">
            <h2 class="card-title">Add Section</h2>
            <form @submit.prevent="addSection">
              <div class="form-group" >
                <label for="section-name">Section Name:</label>
                <input type="text" style="background-color: yellow;" id="section-name" class="form-control" v-model="sectionName" required >
              </div>
              <div class="form-group">
                <label for="section-description">Description:</label>
                <textarea id="section-description" class="form-control" v-model="sectionDescription" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Add Section</button>
              <p v-if="sectionMessage" class="mt-2 text-success">{{ sectionMessage }}</p>
            </form>
          </div>
        </div>

        <!-- Display sections -->
        <div>
          <h2 class="mb-3">Sections</h2>
          <button type="button" class="btn btn-outline-success" @click="download">Download Books CSV</button>
          <div class="row">
            <div class="col-sm-6 mb-4" v-for="section in sections" :key="section.id">
              <div class="card h-100">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">{{ section.name }}</h5>
                  <p class="card-text">{{ section.description }}</p>
                  <p class="card-text"><small class="text-muted">Created on: {{ new Date(section.date_created).toLocaleString() }}</small></p>
                  <div class="mt-auto">
                    <button class="btn btn-primary me-2" @click="viewSection(section.id)">View Section</button>
                    <button class="btn btn-warning me-2" @click="editSection(section)">Edit</button>
                    <button class="btn btn-danger" @click="deleteSection(section.id)">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit section form -->
        <div v-if="editingSection" class="card mt-4">
          <div class="card-body">
            <h2 class="card-title">Edit Section</h2>
            <form @submit.prevent="updateSection">
              <div class="form-group">
                <label for="edit-section-name">Section Name:</label>
                <input type="text" id="edit-section-name" class="form-control" v-model="editingSection.name" required>
              </div>
              <div class="form-group">
                <label for="edit-section-description">Description:</label>
                <textarea id="edit-section-description" class="form-control" v-model="editingSection.description" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Update Section</button>
              <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
              <p v-if="editMessage" class="mt-2 text-success">{{ editMessage }}</p>
              <p v-if="editError" class="mt-2 text-danger">{{ editError }}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  style: `
    .section-form {
      margin-bottom: 20px;
    }
  `
};
