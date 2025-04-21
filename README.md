# ORDELO

## CS696A - Full Stack Enterprise Application Development

**Pace University**  
**Spring 2025**

### Team Members:

1. Sharukh Saiyed
2. Zoha Ahmed
3. Aqif
4. Javid
5. Osaid Khan

### Requirements:

- Golang version 1.24.1 or higher
- Nodejs 22 or higher
- Docker
- Mongo Cloud DB URL
- Spoonacular API Key
- HoneyComb API Key

**Enter the API keys and DB url in the .sh files**

#### To set up env variables run

```bash
chmod 700 env.sh && . ./env.sh
```

#### To set up for test env variables run

```bash
chmod 700 env.sh && . ./env_test.sh
```

#### To Build Golang Sever

```bash
git clone git@github.com:ozzyozbourne/ordelo.git && cd ordelo && go build ./backend/
```

#### Setup Redis and LGTM in docker and run Server

```bash
docker-compose up && ./backend/./ordelo
```
