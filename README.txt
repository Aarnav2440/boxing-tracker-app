Author: Aarnav Lakhanpal

Tech Stack
- Frontend (Client-side): AngularJS, HTML5, CSS
- Middleware / API Layer: Node.js, Express.js
- Backend (Server-side): Node.js
- Database: MongoDB

Project Structure
- client/
  - index.html (SPA shell)
  - js/app.js (AngularJS module, routes, controllers, services)
  - views/ (home, login, profile, schedule)
  - css/style.css (styles)
- server.js (API routes, auth, MongoDB operations)
- package.json / package-lock.json (dependencies and scripts)

How to run:
1. Ensure Node.js and MongoDB are installed on the system.
2. Navigate to the project root directory.
3. Install dependencies using:
   npm install
4. Create a .env file and configure the MongoDB connection URL and server port.
5. Start the server using:
   node server.js
6. Open a web browser and navigate to:
   http://localhost:<PORT>/client/

