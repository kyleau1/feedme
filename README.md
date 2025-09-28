# 🍕 FeedMe - Team Food Ordering Platform

**FeedMe** is a comprehensive team food ordering platform that streamlines group orders for companies and organizations. Built with Next.js, TypeScript, and modern web technologies, it provides a seamless experience for both managers and employees to coordinate group food orders efficiently.

## 🚀 Features

### For Managers
- **Order Session Management**: Create and manage group order sessions with specific time windows
- **DoorDash Integration**: Automatically generate DoorDash group order links
- **Real-time Monitoring**: Track participant responses (ordered, passed, preset orders)
- **Preset Order Management**: Handle special dietary requests and preset orders
- **Company Administration**: Manage company settings and user roles
- **Debug Tools**: Comprehensive debugging tools for troubleshooting

### For Employees
- **Simple Order Interface**: Easy-to-use interface for participating in group orders
- **Multiple Response Options**: 
  - Order directly through DoorDash
  - Pass on the current session
  - Submit preset orders with special requests
- **Real-time Updates**: See live updates of order session status
- **Order History**: View past orders and session participation

### Core Functionality
- **Role-based Access**: Separate dashboards for managers and employees
- **Company Management**: Multi-tenant architecture supporting multiple companies
- **Real-time Notifications**: Live updates for order status changes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure user authentication with Clerk

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **External APIs**: DoorDash Group Orders API, Google Maps API
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/feedme.git
   cd feedme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/custom-signup
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # DoorDash API
   DOORDASH_API_KEY=your_doordash_api_key
   DOORDASH_API_SECRET=your_doordash_api_secret

   # Google Maps API (optional)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Set up the database**
   - Create a Supabase project
   - Run the database migrations (see Database Schema section)
   - Configure Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses the following main tables:

### Companies/Organizations
- `organizations` - Company information
- `users` - User profiles and company associations
- `order_sessions` - Group order sessions
- `session_participants` - User participation in sessions
- `preset_order_requests` - Special dietary requests

### Key Relationships
- Users belong to organizations
- Order sessions belong to organizations
- Session participants link users to order sessions
- Preset order requests are associated with sessions and users

## 🚀 Getting Started

### For First-Time Users

1. **Sign Up**: Create an account using the custom signup flow
2. **Create a Company**: If you're an admin, create a company
3. **Join a Company**: If you're an employee, get invited by your company admin
4. **Start Ordering**: Participate in group order sessions

### For Managers

1. **Access Manager Dashboard**: Navigate to `/manager-dashboard`
2. **Create Order Sessions**: Set up group orders with time windows
3. **Monitor Responses**: Track team member participation in real-time
4. **Handle Preset Orders**: Manage special dietary requests

### For Employees

1. **Access Employee Dashboard**: Navigate to `/employee-dashboard`
2. **View Active Sessions**: See current group order opportunities
3. **Participate**: Order, pass, or submit preset requests
4. **Track History**: View past order participation

## 🔧 API Endpoints

### Order Sessions
- `GET /api/order-sessions` - List all order sessions
- `POST /api/order-sessions` - Create new order session
- `PATCH /api/order-sessions/[id]` - Update session details
- `DELETE /api/order-sessions/[id]` - Delete session

### DoorDash Integration
- `POST /api/doordash/group-orders` - Create DoorDash group order
- `GET /api/doordash/group-orders` - List group orders

### User Management
- `GET /api/check-user-role` - Get user role information
- `POST /api/create-company` - Create new company
- `GET /api/companies` - Get company information

## 🎨 UI Components

The application uses a comprehensive set of UI components built with Radix UI and styled with Tailwind CSS:

- **Layout Components**: Navigation, Header, Footer
- **Form Components**: Input, Select, Button, Checkbox
- **Display Components**: Card, Badge, Alert, Dialog
- **Interactive Components**: Dropdown, Popover, Toast notifications

## 🔒 Security Features

- **Authentication**: Secure user authentication with Clerk
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security (RLS) in Supabase
- **Input Validation**: Comprehensive input validation and sanitization
- **API Security**: Protected API routes with proper authentication

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

This project was built for a hackathon and demonstrates:

- **Full-stack development** with modern web technologies
- **Real-time features** with live updates and notifications
- **External API integration** with DoorDash and Google Maps
- **Responsive design** that works on all devices
- **Scalable architecture** supporting multiple companies
- **User experience focus** with intuitive interfaces

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Issues**: Ensure Clerk keys are correctly set
2. **Database Connection**: Verify Supabase credentials and RLS policies
3. **DoorDash Integration**: Check API keys and rate limits
4. **Build Errors**: Ensure all dependencies are installed

### Debug Tools

The manager dashboard includes comprehensive debug tools for troubleshooting:
- RLS policy testing
- Database connection verification
- API endpoint testing
- Session management tools

## 📞 Support

For support or questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the debug tools in the manager dashboard

---

**Built with ❤️ for better team food ordering experiences**
