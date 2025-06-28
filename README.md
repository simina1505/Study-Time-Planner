# Study-Time-Planner

Study Time Planner - Hategan Simina-Elena

Repository link: https://github.com/simina1505/Study-Time-Planner.git

## Project Structure

This project consists of two main components:

- **Study_Group_Organizer_Backend**: Node.js backend server with Express.js, MongoDB, and Socket.IO
- **Study-Group-Organizer-Frontend**: React Native mobile application built with Expo

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (optional, for managing your MongoDB database visually)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) installed globally:
  ```bash
  npm install -g @expo/cli
  ```
- **Expo Go** app on your mobile device for testing
- [Visual Studio Code](https://code.visualstudio.com/) (recommended editor)
- [Expo Go](https://expo.dev/client) app installed from the App Store (iOS) or Google Play Store (Android)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd StudyTimePlanner-Hategan_Simina_Elena
```

### 2. Backend Setup (Study_Group_Organizer_Backend)

1. **Navigate to the backend directory:**

   ```bash
   cd Study_Group_Organizer_Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend root directory:

   ```env
   PORT=3000
   MONGODB_URL=mongodb://localhost:27017/studygrouporganizer
   JWT_SECRET=your-jwt-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   CLOUDINARY_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   FRONTEND_URL=http://localhost:3000
   GOOGLE_API_KEY=your-google-api-key
   ```

4. **Set up Firebase Admin SDK:**

   - Download your Firebase service account key
   - Place it in the backend root directory
   - Rename it to match the pattern: `studygrouporganizer-firebase-adminsdk-[unique-id].json`

5. **Import CSV data into MongoDB:**

   Add the .csv files to MongoDB using MongoDB Compass:

   1. Open **MongoDB Compass** and connect to your MongoDB instance.
   2. Select your target database or create a new one.
   3. Click on the desired collection or create a new collection.
   4. Click the **"Add Data"** button and choose **"Import File"**.
   5. Select your CSV file, set the file type to **CSV**, and configure any import options as needed.
   6. Click **"Import"** to add the data to your collection.

   Make sure MongoDB is running and the CSV files are properly formatted.

6. **Start the backend server:**

   ```bash
   nodemon index.js
   ```

   The server will start on port 3000 (or your specified port).

### 3. Frontend Setup (Study-Group-Organizer-Frontend)

1. **Navigate to the frontend directory:**

   ```bash
   cd ../Study-Group-Organizer-Frontend/Study-Group-Organizer
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure the backend URL:**

   - Copy `constants/config-exemple.js` to `constants/config.js`
   - Update the `SERVER_URL` in your new `config.js` file:

   ```javascript
   const SERVER_URL = "http://localhost:3000";
   ```

4. **Start the frontend application:**

   ```bash
   npx expo start -c
   ```

   The `-c` flag clears the cache for a fresh start.

### 4. Testing the Application

1. **Install Expo Go** on your mobile device from the App Store (iOS) or Google Play Store (Android)
2. **Scan the QR code** displayed in your terminal or browser after running `npx expo start -c`
3. **The app will load** on your device

## Running the Complete Application

To run both frontend and backend simultaneously:

1. **Terminal 1 - Backend:**

   ```bash
   cd Study_Group_Organizer_Backend
   nodemon index.js
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd Study-Group-Organizer-Frontend/Study-Group-Organizer
   npx expo start -c
   ```

## Features

- User authentication and authorization
- Study group creation and management
- Real-time messaging with Socket.IO
- Location-based group discovery
- Task and quiz management
- Session scheduling
- QR code scanning for quick group joining
- File sharing capabilities

## Troubleshooting

- Make sure MongoDB is running before starting the backend
- Import your CSV files into MongoDB as described above
- Ensure both frontend and backend are running on different ports
- Check that your mobile device and development machine are on the same network
- Verify all environment variables are properly configured
