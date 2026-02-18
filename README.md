# README #

### What is this repository for? ###

This repo contains the code needed to set up a copy of labyrinth on your local computer or cloud server.

### How do I get set up? ###

**Local Setup:**

1. Clone the repo locally, make sure you have node version 24.13 or greater (`node -v`)
2. `cd labyrinth`
3. `npm install`
4. `node index`


**Special Instructions for server setup:**


1. Swap the 'localhost' in var socket = io.connect('localhost:4000'); (Line 2 of main.js) with the IP of your server.
2. Make sure your server is set up correctly for incoming and outgoing ports.
3. Navigate into the repo and type
`node index`

4. In a web browser, type your server IP:4000 in the URL bar.


* Sidd Viswanathan