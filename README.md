# Voter Declaration Registration

Voter Declaration Registration App for JFK21

## Getting Started

After cloning the repo, install the dependencies in the `functions` folder:

```bash
$ npm install
```

### Running Locally

It is not possible to run the entire application locally due to the following:

- Access to real Firestore database
- Sengrid API key

### Build

In order to build the app, run the following in the `functions` folder:

```bash
$ npm run build
```

### Deployment

Use Firebase CLI (`firebase-tools`) version 4.2.1 or above together with Node.js version 8 or above and NPM 5 or above:

```bash
$ firebase deploy
```
