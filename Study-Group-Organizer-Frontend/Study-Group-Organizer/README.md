# Study Group Organizer - Frontend

A modern React Native mobile application built with Expo for organizing and managing study groups. This app helps students create, join, and manage study groups with features like location-based group discovery, task management, quiz creation, and real-time chat.

## Features

- **Authentication**: Sign up and sign in functionality
- **Study Groups**: Create, edit, and manage study groups
- **Location Services**: Find nearby study groups using maps
- **Session Management**: Create and manage study sessions
- **Task Board**: Organize group tasks and assignments
- **Quiz System**: Create and take quizzes within groups
- **QR Code Scanner**: Quick group joining via QR codes
- **Real-time Chat**: Communicate with group members
- **File Sharing**: Share documents and resources
- **Profile Management**: Customize user profiles

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.io
- **Maps**: React Native Maps
- **Charts**: React Native Chart Kit
- **Camera/Scanner**: Expo Camera & Barcode Scanner
- **File System**: Expo File System
- **Date/Time**: Moment.js

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** installed globally: `npm install -g @expo/cli`
- **Expo Go** app installed on your mobile device (for testing)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Study-Group-Organizer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure the backend URL**
   - Copy `constants/config-exemple.js` to `constants/config.js`
   - Update the `SERVER_URL` in your new `config.js` file:
   ```javascript
   const SERVER_URL = "http://your-backend-url:port";
   ```

## Running the Application

### Development Mode

1. **Start the Expo development server**

   ```bash
   npm start
   ```

   or

   ```bash
   expo start
   ```

### Testing on Physical Device

1. Install **Expo Go** from the App Store (iOS) or Google Play Store (Android)
2. Scan the QR code displayed in your terminal or browser
3. The app will load on your device

## Project Structure

```
Study-Group-Organizer/
├── app/                          # Main application screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.jsx
│   │   └── sign-up.jsx
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── (groups)/             # Group-related screens
│   │   │   ├── create-group.jsx
│   │   │   ├── group-page.jsx
│   │   │   ├── my-groups.jsx
│   │   │   ├── task-board.jsx
│   │   │   ├── quiz-page.jsx
│   │   │   └── map.jsx
│   │   ├── (home)/               # Home screen
│   │   ├── (profile)/            # Profile screens
│   │   └── (scanner)/            # QR scanner
│   ├── _layout.jsx               # Root layout
│   └── index.jsx                 # Entry point
├── assets/                       # Static assets
│   ├── fonts/                    # Custom fonts
│   └── *.png                     # Images and icons
├── components/                   # Reusable components
│   ├── CustomButton.jsx
│   ├── FormField.jsx
│   └── SearchInput.jsx
├── constants/                    # App constants
│   └── config.js                 # Configuration file
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── metro.config.js               # Metro bundler configuration
```

## Configuration

### Backend Configuration

- Update `constants/config.js` with your backend server URL
- Ensure your backend server is running and accessible
