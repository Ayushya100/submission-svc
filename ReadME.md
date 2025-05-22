# 💻 Submission-svc

## 🧩 Introduction
Welcome to the GitHub repository for **Submission SVC** - This service is responsible for handling the submissions in a coding platform environment. It manages the lifecycle of a submission - receiving user-submitted code, sending it for evaluation, storing results, and tracking submission history.

## 📌 Project Status: Under Development
### What's Happening Now:
- The service is under development to leverage the functionalities of handling the user submissions for coding challenges across different domains.

## 🚀 Features
### Overview
This service plays a vital role in powering the problem-solving engine of our platform. It handles the lifecycle of submissions made by the user, sending it for evaluation, storing the results, and tracking submission history.
### Key Features:
- **Code Submission Management:** Handles the incoming code submissions from users, sending it to Judge0 engine for evaluation, and storing the result.
- **Real-time Submission Status:** Returns real-time submission status and results.
- **Submission History Management:** Maintains submission history per user/problem.

## Usage
This service acts as a backend repository of submissions, feeding the UI and execution engines with structured submission data. User interact with it indirectly while solving challenges through the platform.

## Security
API routes are secured using bearer tokens and role-based access control. Input validations are enforced using OpenAPI specs to ensure data consistency and protection against injection or malformed requests.

## API Endpoints
### Health & Utility APIs
| Method | Endpoint                                                 | Description                              |
| :----- | :------------------------------------------------------- | :--------------------------------------- |
| GET    | `/api-docs/`                                             | View docs for service                    |
| GET    | `/submission-svc/api/v1.0/health`                        | Health Check Service                     |

## 🛠️ Setup Instructions
| Method | Endpoint                                                    | Description                              |
| :----- | :---------------------------------------------------------- | :--------------------------------------- |
| POST   | `/submission-svc/api/v1.0/submission`                       | Register user submissions for a sheet    |
| GET    | `/submission-svc/api/v1.0/submission/:sheetID`              | Get user submission list for a sheet     |
| GET    | `/submission-svc/api/v1.0/submission/:sheetID/:submissionId`| Get user submission detail               |
| DELETE | `/submission-svc/api/v1.0/submission/clear`                 | Clear user submissions                   |

```bash
# Clone the repository
git clone https://github.com/Ayushya100/submission-svc.git
cd problems-svc

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Then configure your .env file

# Run the server
npm run start
```

## Judge0 Windows Installation

```bash
# Open powershell
# Install and Setup WSL for hosting Judge0 infrastructure
wsl --install

# Enter in linux environment
wsl

# Update and Install docker.io and docker-compose
sudo apt update
sudo apt install -y docker.io
sudo apt install -y docker-compose

# Download and extract Judge0
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip

# Enter into Judge0
ls
cd judge0-v1.13.1

# There will be two files available inside the unzipped Judge0 - docker-compose.yml and judge0.conf
# Visit to the website provided by the Judge0 to generate random passwrd (https://www.random.org/passwords/?num=1&len=32&format=plain&rnd=new)
# Run below command to make changes in Judge0 configuration
nano judge0.conf

# Add passwords for REDIS_PASSWORD and POSTGRES_PASSWORD
# To write out the changes: ctrl + O
# Exit: ctrl + x

# Command to run the redis image
docker-compose up -d db redis

# Command to run the workers and servers
docker-compose up -d
# If command fails try adding sudo as suffix to the above command and try.

# Test if Judge0 installed and running successfully by visiting
http://localhost:2358
http://localhost:2358/docs
```

## Judge0 Initiation Failure

```bash
# Open powershell
# Enter in linux environment
wsl

# Enter into Judge0
ls
cd judge0-v1.13.1

# Restart Judge0 with the below commands
docker-compose up -d db redis
docker-compose up -d

# Test if Judge0 installed and running successfully by visiting
http://localhost:2358/docs

# Check via curl command
curl -v http://localhost:2358/workers
```

## 📦 Tech Stack
- **Language:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Auth:** JWT
- **Validation:** OpenAPI Spec
- **Query Builder:** Knex.js
- **Environment Management:** dotenv
---
**Submission-svc** - Powering Code and API Challenges for Developers!