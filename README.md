# HomeCooks - Home Cooking Marketplace

A React Native mobile application connecting home cooks with local customers seeking authentic homemade meals. Built with Expo and Firebase for a seamless cross-platform experience.

## 🍳 Overview

HomeCooks enables passionate home cooks to share their culinary creations with their local community while providing customers access to authentic, homemade meals. The platform facilitates the entire process from meal discovery to order fulfillment.

## ✨ Features

### For Customers
- **Browse & Discovery**: Location-based meal browsing with cuisine filters
- **Real-time Search**: Search by meal name, ingredients, or cuisine type
- **Order Management**: Place orders for pickup or delivery
- **Order Tracking**: Real-time status updates from preparation to completion
- **Reviews & Ratings**: Rate and review meals and cooks
- **Profile Management**: Manage delivery addresses and preferences

### For Home Cooks
- **Cook Dashboard**: Comprehensive overview of orders, meals, and statistics
- **Meal Management**: Create, edit, and manage meal listings
- **Profile Setup**: Complete cook profiles with bio, specialties, and location
- **Order Processing**: Receive and manage incoming orders
- **Availability Control**: Set cooking schedules and meal availability
- **Delivery Options**: Configure pickup and delivery preferences

### Shared Features
- **Authentication**: Email/password and Google sign-in support
- **Real-time Updates**: Live order status synchronization
- **Location Services**: GPS-based cook discovery and delivery
- **Image Upload**: Meal photos with Firebase Storage
- **Cross-platform**: iOS, Android, and web support

## 🛠 Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Firebase
  - Authentication
  - Firestore (NoSQL database)
  - Storage (image hosting)
  - Cloud Functions (future)
- **State Management**: React Context API
- **Form Handling**: Formik with Yup validation
- **UI Components**: Custom themed components with Ionicons
- **Location**: Expo Location with basic geospatial queries
- **Image Handling**: Expo Image Picker

## 🎨 Design System

### Color Palette
- Primary: `#05668d` (Deep Blue)
- Secondary: `#028090` (Teal)
- Tertiary: `#00a896` (Green-Teal)
- Success: `#02c39a` (Mint Green)
- Light Accent: `#f0f3bd` (Cream)

### Theme
- Modern, clean interface prioritizing food imagery
- Consistent navigation patterns
- Responsive design for various screen sizes
- Support for light/dark mode adaptation

## 📱 App Structure

### Authentication Flow
```
├── /auth
│   ├── login.tsx          # Email/Google sign-in
│   ├── register.tsx       # User registration with type selection
│   └── forgotpassword.tsx # Password reset
```

### Main Navigation (Tabs)
```
├── /(tabs)
│   ├── index.tsx          # Home feed
│   ├── browse.tsx         # Meal discovery
│   ├── orders.tsx         # Order management
│   └── profile.tsx        # User profile
```

### Cook-Specific Features
```
├── /cook
│   ├── dashboard.tsx      # Cook dashboard
│   ├── profile-setup.tsx  # Cook profile configuration
│   ├── meals.tsx          # Meal management
│   ├── addMeal.tsx        # Create new meals
│   └── editMeal.tsx       # Edit existing meals
```

### Dynamic Routes
```
├── /meal/[id].tsx         # Meal details and ordering
├── /order/[id].tsx        # Order details and tracking
└── /cook/[id].tsx         # Cook profile viewing
```

## 🗄 Database Schema

### Collections

#### `users`
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  userType: 'cook' | 'customer';
  photoURL?: string;
  location?: GeoPoint;
  createdAt: Timestamp;
}
```

#### `cook_profiles`
```typescript
{
  uid: string;
  bio: string;
  cuisineTypes: string[];
  deliveryAvailable: boolean;
  deliveryRadius?: number;
  deliveryFee?: number;
  minimumOrderAmount?: number;
  averageRating?: number;
  totalReviews?: number;
  location?: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `meals`
```typescript
{
  id: string;
  cookId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  cuisineType: string;
  preparationTime: number;
  available: boolean;
  availabilitySchedule: MealAvailability;
  location?: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `orders`
```typescript
{
  id: string;
  customerId: string;
  cookId: string;
  mealId: string;
  quantity: number;
  status: OrderStatus;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: LocationAddress;
  specialInstructions?: string;
  requestedTime: Timestamp;
  totalAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `reviews`
```typescript
{
  id: string;
  orderId: string;
  customerId: string;
  cookId: string;
  mealId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project setup
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd homecooks
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Firebase Configuration**
   
   Create a Firebase project and add the configuration:
   
   ```bash
   # Create .env file in project root
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firebase Setup**
   - Enable Authentication (Email/Password and Google)
   - Create Firestore database
   - Enable Storage
   - Set up security rules

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on devices**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cook profiles are readable by all, writable by owner
    match /cook_profiles/{cookId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == cookId;
    }
    
    // Meals are readable by all, writable by cook owner
    match /meals/{mealId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.cookId;
    }
    
    // Orders accessible by customer and cook involved
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.customerId || 
         request.auth.uid == resource.data.cookId);
    }
    
    // Reviews readable by all, writable by customer who placed order
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.customerId;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /meals/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📂 Project Structure

```
app/
├── _layout.tsx                 # Root layout with auth guard
├── (tabs)/                     # Tab navigation
│   ├── _layout.tsx
│   ├── index.tsx              # Home screen
│   ├── browse.tsx             # Meal browsing
│   ├── orders.tsx             # Order management
│   └── profile.tsx            # User profile
├── auth/                      # Authentication screens
├── cook/                      # Cook-specific screens
├── meal/[id].tsx             # Dynamic meal details
├── order/[id].tsx            # Dynamic order details
├── components/               # Reusable components
├── contexts/                 # React contexts
├── services/                 # API services
├── config/                   # Configuration files
├── constants/                # App constants
└── hooks/                    # Custom hooks
```

## 🔧 Key Services

### Authentication Service (`app/services/auth.ts`)
- User registration and login
- Google authentication integration
- User profile management
- Auth state management

### Meal Service (`app/services/meals.ts`)
- CRUD operations for meals
- Image upload handling
- Availability management
- Cuisine filtering

### Order Service (`app/services/orders.ts`)
- Order creation and management
- Status tracking and updates
- Customer and cook order queries

### Location Service (`app/services/location.ts`)
- GPS location access
- Address geocoding
- Distance calculations
- Nearby cook discovery

### Review Service (`app/services/reviews.ts`)
- Review creation and management
- Rating calculations
- Cook rating aggregation

## 🧪 Testing

### Test Structure
```
components/__tests__/
├── ThemedText-test.tsx
└── __snapshots__/
```

### Running Tests
```bash
npm test
# or
yarn test
```

## 📦 Building for Production

### Android Build
```bash
npx expo build:android
```

### iOS Build
```bash
npx expo build:ios
```

### Web Build
```bash
npx expo export:web
```

## 🔐 Environment Variables

Required environment variables for Firebase configuration:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## 🚧 Current Limitations

- Basic location-based search (no advanced geospatial indexing)
- Simple recommendation system
- Manual order status updates
- Basic payment integration placeholder
- Limited real-time notifications

## 🔮 Future Enhancements

### Phase 1 - Core Improvements
- [ ] Real-time notifications (Firebase Cloud Messaging)
- [ ] Advanced search with Algolia integration
- [ ] Payment processing (Stripe integration)
- [ ] Push notifications for order updates
- [ ] Enhanced location services with GeoFirestore

### Phase 2 - Advanced Features
- [ ] AI-powered meal recommendations
- [ ] In-app messaging between cooks and customers
- [ ] Advanced analytics dashboard
- [ ] Bulk order management
- [ ] Seasonal menu management

### Phase 3 - Scale & Optimization
- [ ] Performance optimizations
- [ ] Advanced caching strategies
- [ ] Background sync capabilities
- [ ] Offline functionality
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting
- Write meaningful commit messages
- Update documentation for new features
- Test on both iOS and Android platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review Firebase configuration requirements

## 🏗 Architecture Decisions

### State Management
- **React Context**: Chosen for simplicity and built-in React integration
- **No Redux**: Avoided complexity for this scale of application
- **Local State**: Component-level state for UI-specific data

### Navigation
- **Expo Router**: File-based routing for better developer experience
- **Tab Navigation**: Primary navigation pattern for mobile-first approach
- **Stack Navigation**: Secondary navigation for detailed views

### Data Persistence
- **Firebase Firestore**: NoSQL database for scalability and real-time features
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Offline Considerations**: Basic caching with React Query potential

### Code Organization
- **Service Layer**: Abstracted Firebase operations
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Shared logic extraction
- **Type Safety**: Comprehensive TypeScript coverage

---

Built with ❤️ using React Native and Firebase