# Capstone FE REST API Contract Overview

## Authentication Endpoints
- `POST /api/v1/auth/login` -> `{ email, password }` -> returns `{ user, token, refreshToken }`
- `POST /api/v1/auth/register` -> `{ fullName, email, phoneNumber, password, role }`

