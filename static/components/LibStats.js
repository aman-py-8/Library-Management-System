import Navbar from "./Navbar.js";
export default {
    name: 'LibStats',
    components: {
        Navbar
      },
    data() {
      return {
        stats: {},
        errorMessage: '',
        chartData: {
          labels: ['Total Setions', 'Total Ebooks', 'Total Users', 'Total Requests', 'Total Granted Books'],
          datasets: [
            {
              label: 'Library Statistics',
              backgroundColor: ['#79ff4d', '#f87979', '#a6c48a', '#f3a683', '#786fa6'],
              data: []
            }
          ]
        }
      };
    },
    methods: {
      async fetchStats() {
        try {
          const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
          });
          if (response.ok) {
            const data = await response.json();
            this.stats = data;
            this.chartData.datasets[0].data = [
              data.total_sections,
              data.total_ebooks,
              data.total_users,
              data.total_requests,
              data.total_granted_books
            ];
            this.renderChart(); // Render chart after fetching data
          } else {
            const errorData = await response.json();
            this.errorMessage = errorData.message || 'Failed to fetch stats.';
          }
        } catch (error) {
          this.errorMessage = 'An error occurred while fetching stats.';
          console.error('Error:', error);
        }
      },
      renderChart() {
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: this.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    },
    created() {
      this.fetchStats();
    },
    template: `
    <div> <Navbar />
      <div class="container mt-4">
        <h2>Library Statistics</h2>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <div v-else>
          <div class="card">
          <div class="card-body">
              <h5 class="card-title">Total Sections</h5>
              <p class="card-text">{{ stats.total_sections }}</p>
            </div>
            <div class="card-body">
              <h5 class="card-title">Total Ebooks</h5>
              <p class="card-text">{{ stats.total_ebooks }}</p>
            </div>
          </div>
          <div class="card mt-3">
            <div class="card-body">
              <h5 class="card-title">Total Users</h5>
              <p class="card-text">{{ stats.total_users }}</p>
            </div>
          </div>
          <div class="card mt-3">
            <div class="card-body">
              <h5 class="card-title">Total Requests</h5>
              <p class="card-text">{{ stats.total_requests }}</p>
            </div>
          </div>
          <div class="card mt-3">
            <div class="card-body">
              <h5 class="card-title">Total Granted Books</h5>
              <p class="card-text">{{ stats.total_granted_books }}</p>
            </div>
          </div>
          <div class="mt-5">
            <canvas id="myChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
      </div>
    `
  };
  