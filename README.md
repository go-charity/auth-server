# AUTH-SERVER

This is the API server microservice for the authentication interface which is responsible for authenticating and authorizing the user's access to the application

## HOW TO USE

- **Run the project directly on your system**:

  > To run this project directly on your system you will need [**Node.Js**](https://nodejs.org/en/download) version **16.15.0** or higher

  - Run `git clone https://github.com/go-charity/auth-server.git`
  - Run `npm i -f`
  - Run `npm run build`
  - Run `npm run dev`

- **Run the project using Docker**:

  > To run this project as a container you will need [**Docker**](https://www.docker.com/products/docker-desktop/)

  - Run `git clone https://github.com/go-charity/auth-server.git`
  - Run `docker build -t gocharity/auth-server:latest .`
  - Run `docker run -p 5000:5000 -it -d gocharity/auth-server:latest`

- **Test this project**:
  > To test this project directly on your system you will need [**Node.Js**](https://nodejs.org/en/download) version **16.15.0** or higher
  - Run `git clone https://github.com/go-charity/auth-server.git`
  - Run `npm i -f`
  - Run `npm test`
