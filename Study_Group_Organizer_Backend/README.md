# Study Group Organizer Backend

A Node.js backend server for the Study Group Organizer application, built with Express.js, MongoDB, Socket.IO, and Firebase Admin SDK.

## Features

- User authentication and authorization
- Study group management
- Real-time messaging with Socket.IO
- File uploads and sharing
- Quiz and task management
- Session scheduling
- Location-based services
- Firebase integration

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repository-url>
   cd Study_Group_Organizer_Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables: ```env
   PORT=3000
   MONGODB_URL=mongodb://localhost:27017/studygrouporganizer

   # or use MongoDB Atlas connection string:

   # MONGODB_URL="mongo_string"

   # Add other environment variables as needed

   JWT_SECRET=your-jwt-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   CLOUDINARY_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   FRONTEND_URL=http://localhost:3000
   GOOGLE_API_KEY=your-google-api-key

   ```

   ```

4. **Set up Firebase Admin SDK:**

   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key" to download your service account key
   - Rename the downloaded file to match the pattern: `studygrouporganizer-firebase-adminsdk-fbsvc-[unique-id].json`
   - Place it in the root directory of this project
   - The file should look like the `studygrouporganizer-firebase-adminsdk-example.json` template

   **Important:** Never commit your actual Firebase credentials to version control!

## Running the Application

### Development Mode

```bash
npm start
```

This will start the server using nodemon, which automatically restarts the server when you make changes to the code.

### Production Mode

```bash
node index.js
```

The server will start on the port specified in your `.env` file (default: 3000).

You should see output similar to:

```
Connected to MongoDB
Server running on port 3000
Firebase Admin initialized successfully
```

## API Endpoints

The server provides the following API routes:

- **Authentication:** `/api/auth`
  - User registration, login, password reset
- **Users:** `/api/users`
  - User profile management
- **Groups:** `/api/groups`
  - Study group creation and management
- **Sessions:** `/api/sessions`
  - Study session scheduling
- **Messages:** `/api/messages`
  - Messaging and file sharing
- **Tasks:** `/api/tasks`
  - Task management within groups
- **Quizzes:** `/api/quizzes`
  - Quiz creation and management
- **Profile:** `/api/profile`
  - User profile operations

## Real-time Features

The application uses Socket.IO for real-time communication:

- Live messaging in study groups
- Real-time notifications
- Live updates for group activities

## Database Models

The application uses the following MongoDB models:

- **User:** User accounts and profiles
- **Group:** Study groups
- **Session:** Study sessions
- **Message:** Chat messages
- **File:** File uploads
- **Task:** Group tasks
- **Quiz:** Quizzes and questions
- **City:** Location data
- **Subjects:** Academic subjects

## Project Structure

```
Study_Group_Organizer_Backend/
├── models/              # MongoDB models
├── routes/              # API route handlers
├── index.js            # Main server file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create this)
├── .gitignore         # Git ignore rules
└── studygrouporganizer-firebase-adminsdk-*.json  # Firebase credentials
```

## License

This project is licensed under the ISC License.
