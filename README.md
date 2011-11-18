# Touhou Wiki Front Page
A web page, inspired somewhat by the front page of Wikipedia, that links to multiple languages of the Touhou Wiki. Includes a search bar that gives search suggestions.

See it live at http://www.touhouwiki.net/

There's an easter egg hidden in there somewhere. Go ahead and find it.

## Known Issues
- Script does not fail gracefully on unresponsive API calls. If one of the wiki servers is down, then the PHP script will wait and wait until it hits its execution time limit, and then it spits out a page with no language selectors on it.
