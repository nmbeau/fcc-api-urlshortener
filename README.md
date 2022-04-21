# [URL Shortener Microservice](https://www.freecodecamp.org/learn/back-end-development-and-apis/back-end-development-and-apis-projects/url-shortener-microservice)

[My solution!](https://boilerplate-project-urlshortener.willbeaumont.repl.co/)

I added an API in `server.js` to store a URL in MongoDB and return a JSON object with the `original_url` and assigned `short_url`.
Users are redirected to the `original_url` when the `short_url` is sent to the API.

## Prompt
* You should provide your own project, not the example URL.
* You can POST a URL to `/api/shorturl` and get a JSON response with `original_url` and `short_url` properties. Here's an example: `{ original_url : 'https://freeCodeCamp.org', short_url : 1}`
* When you visit `/api/shorturl/<short_url>`, you will be redirected to the original URL.
* If you pass an invalid URL that doesn't follow the valid `http://www.example.com` format, the JSON response will contain `{ error: 'invalid url' }`

## My Code's Logic
* Create MongoDB schema and init `Url` model.
* POST - `/api/shorturl`
  * Check if request URL is valid.
  * If new, add `original_url` to database.
    * Increment the max `short_url` and assign to new `original_url`.
  * Return `original_url` and `short_url`.
* GET - `/api/shorturl/:urlnum`
  * Lookup `original_url` using `short_url`.
  * Redirect to `original_url`.