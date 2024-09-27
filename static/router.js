import Home from './components/Home.js';
import login from './components/login.js';
import Register from './components/Register.js';
import UserDashboard from './components/UserDashboard.js';
import LibrarianDashboard from './components/LibrarianDashboard.js';
import SectionDetails from './components/SectionDetails.js';
import EbookRequests from './components/EbookRequests.js';
import MyBooks from './components/MyBooks.js';
import ViewBook from './components/ViewBook.js';
import UserProfile from './components/UserProfile.js';
import SearchResults from "./components/SearchResults.js";
import LibStats from './components/LibStats.js';
import Payment from './components/Payment.js';

const routes = [
    { path: '/', component: Home},
    { path: '/login', component: login},
    { path: '/register', component: Register},
    { path: '/userdash', component: UserDashboard},
    { path: '/libdash', component: LibrarianDashboard},
    { path: '/sections/:id', component: SectionDetails},
    { path: '/ebook-requests', component: EbookRequests},
    { path: '/my-books', component: MyBooks },
    { path: '/book/:id', component: ViewBook },
    { path: '/user-profile', component: UserProfile },
    { path: '/search-results', component: SearchResults, props: route => ({ query: route.query.query })},
    { path: '/libstats', component: LibStats},
    { path: '/payment', component: Payment }

]


export default new VueRouter({
    routes,
  })