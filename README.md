# Tarpaulin RESTful API

Welcome to the Tarpaulin project repository! As the team lead, I steered a group of three skilled software engineers in developing a RESTful API for Tarpaulin, a nimble course management tool designed as an alternative to Canvas.

## Project Leadership Role

My contributions were multifaceted, ensuring the project's success:

- **Task Organization:** Strategically organizing and delegating tasks to team members.
- **Tech Integration:** Bridging Docker with Node.js for a seamless development environment.
- **User Authorization:** Enforcing secure access controls for different user roles.
- **Database Management:** Overseeing the database to ensure integrity and performance.
- **HTTP Request Handling:** Designing and implementing a responsive API endpoint structure.

### Technologies and Tools

Our project leveraged a robust stack:

- **Languages:** Node.js, JavaScript
- **Database:** MongoDB
- **Containerization:** Docker
- **Version Control:** GitHub
- **API Testing:** Insomnia

## Core Entities

### Users

Users of the Tarpaulin application are categorized into three roles: admin, instructor, and student, each with unique permissions.

### Courses

Courses within Tarpaulin include detailed information like subject code, title, and instructor, linking to students enrolled and assignments set.

### Assignments

Each assignment, tied to a specific course, includes essential details such as title and due date, alongside student submissions.

### Submissions

Submissions represent the efforts of students, linked to both the assignment and the student, marked with a timestamp and associated file.

## Docker Integration

Tarpaulin's infrastructure, including our MongoDB database, operates within Docker containers to ensure consistency across development and production environments.

## Further Exploration

For a comprehensive overview of Tarpaulin's RESTful API, visit the Swagger Editor: [https://editor.swagger.io](https://editor.swagger.io).

## Setup Instructions

1. Clone this repository to your local machine.
2. Install Docker and set up the MongoDB container.
3. Run `npm install` to install dependencies.

### Running the API

- Launch the Docker container.
- Start the development server with `npm run dev`.

### GitHub Workflow

- Update your branch: `git pull origin <branch-name>`
- For the main branch: `git pull`
- Create a feature branch: `git checkout -b feature-<yourname> main`
- Commit changes: `git commit -a -m "Your commit message"`
