# How to set up the test environment

# before running the tests, make sure you have the following installed:

### Create database before running the tests:

```
docker run --rm -it --name bedbase-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=docker\
  -e POSTGRES_DB=bedbase \
  -p 5432:5432 postgres
```
