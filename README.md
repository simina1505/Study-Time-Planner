# Study Time Planner

Study Time Planner - Hategan Simina-Elena

## Descrierea aplicației

Această aplicație ajută studenții să își organizeze eficient timpul de studiu prin crearea și gestionarea grupurilor de studiu, programarea sesiunilor, partajarea de materiale și comunicarea în timp real. Platforma oferă funcționalități precum autentificare, gestionare sarcini, quiz-uri și mesagerie instant pentru o experiență colaborativă completă.

Link către repository: https://github.com/simina1505/Study-Time-Planner.git

## Structura Proiectului

Acest proiect este format din două componente principale:

- **Study_Group_Organizer_Backend**: Server backend Node.js cu Express.js, MongoDB și Socket.IO
- **Study-Group-Organizer-Frontend**: Aplicație mobilă React Native construită cu Expo

## Cerințe preliminare

Înainte de a rula acest proiect, asigură-te că ai instalat următoarele:

- [Node.js](https://nodejs.org/) (versiunea 18 sau mai nouă)
- [MongoDB](https://www.mongodb.com/) (instalare locală sau cont MongoDB Atlas)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (opțional, pentru gestionarea vizuală a bazei de date)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) instalat global:
  ```bash
  npm install -g @expo/cli
  ```
- Aplicația **Expo Go** pe dispozitivul tău mobil pentru testare
- [Visual Studio Code](https://code.visualstudio.com/) (editor recomandat)
- [Expo Go](https://expo.dev/client) instalat din App Store (iOS) sau Google Play Store (Android)

## Instalare & Configurare

### 1. Clonează Repository-ul

```bash
git clone <your-repository-url>
cd StudyTimePlanner-Hategan_Simina_Elena
```

### 2. Configurare Backend (Study_Group_Organizer_Backend)

1. **Navighează în directorul backend:**

   ```bash
   cd Study_Group_Organizer_Backend
   ```

2. **Instalează dependențele:**

   ```bash
   npm install
   ```

3. **Configurează variabilele de mediu:**
   Creează un fișier `.env` în directorul principal al backend-ului:

   ```env
   PORT=3000
   MONGODB_URL=mongodb://localhost:27017/studygrouporganizer
   JWT_SECRET=cheia-ta-secreta-jwt
   EMAIL_USER=adresa-ta-email@gmail.com
   EMAIL_PASS=parola-ta-email
   CLOUDINARY_NAME=numele-tău-cloudinary
   CLOUDINARY_API_KEY=cheia-ta-api-cloudinary
   CLOUDINARY_API_SECRET=secretul-tău-api-cloudinary
   FRONTEND_URL=http://localhost:3000
   GOOGLE_API_KEY=cheia-ta-api-google
   ```

4. **Configurează Firebase Admin SDK:**

   - Descarcă cheia contului de serviciu Firebase
   - Salvează fișierul în directorul principal al backend-ului
   - Redenumește fișierul conform modelului: `studygrouporganizer-firebase-adminsdk-[id-unic].json`

5. **Importă datele CSV în MongoDB:**

   Adaugă fișierele .csv în MongoDB folosind MongoDB Compass:

   1. Deschide **MongoDB Compass** și conectează-te la instanța ta MongoDB.
   2. Selectează baza de date țintă sau creează una nouă.
   3. Selectează colecția dorită sau creează una nouă.
   4. Apasă pe butonul **"Add Data"** și alege **"Import File"**.
   5. Selectează fișierul CSV, setează tipul fișierului pe **CSV** și configurează opțiunile de import după nevoie.
   6. Apasă **"Import"** pentru a adăuga datele în colecție.

   Asigură-te că MongoDB rulează și fișierele CSV sunt corect formate.

6. **Pornește serverul backend:**

   ```bash
   nodemon index.js
   ```

   Serverul va porni pe portul 3000 (sau portul specificat de tine).

### 3. Configurare Frontend (Study-Group-Organizer-Frontend)

1. **Navighează în directorul frontend:**

   ```bash
   cd ../Study-Group-Organizer-Frontend/Study-Group-Organizer
   ```

2. **Instalează dependențele:**

   ```bash
   npm install
   ```

3. **Configurează URL-ul backend-ului:**

   - Copiază `constants/config-exemple.js` în `constants/config.js`
   - Actualizează `SERVER_URL` în noul fișier `config.js`:

   ```javascript
   const SERVER_URL = "http://localhost:3000";
   ```

4. **Pornește aplicația frontend:**

   ```bash
   npx expo start -c
   ```

   Opțiunea `-c` curăță cache-ul pentru o pornire proaspătă.

### 4. Testarea aplicației

1. **Instalează Expo Go** pe dispozitivul tău mobil din App Store (iOS) sau Google Play Store (Android)
2. **Scanează codul QR** afișat în terminal sau browser după rularea comenzii `npx expo start -c`
3. **Aplicația se va încărca** pe dispozitivul tău

## Rularea completă a aplicației

Pentru a rula simultan frontend-ul și backend-ul:

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

## Probleme frecvente

- Asigură-te că MongoDB rulează înainte de a porni backend-ul
- Importă fișierele CSV în MongoDB conform instrucțiunilor de mai sus
- Asigură-te că frontend-ul și backend-ul rulează pe porturi diferite
- Verifică dacă dispozitivul mobil și calculatorul de dezvoltare sunt în aceeași rețea
- Verifică dacă toate variabilele de mediu sunt configurate corect
