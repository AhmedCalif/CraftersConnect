let projects = [
    {
        id: 1,
        username: "ahmedcalif",
        title: "Project 1",
        description: "Description of Project 1",
        date: "2024-05-15",
        steps: [{ id: 1, description: "Step 1" }, {id: 2, description: "Step 2"}, {id: 3, description: "Step 3"}]
    },
    {
        id: 2,
        username: "allisondahan",
        title: "Project 2",
        description: "Description of Project 2",
        date: "2024-06-30",
        steps: [{id: 1, description: "Step A"}, {id: 2, description: "Step B"}, {id: 3, description: "Step C"}]
    }
];


function generateId() {
    return projects.length > 0 ? projects[projects.length - 1].id + 1 : 1;
}

function addProject(title, description, steps, username) {
    console.log('Steps before processing:', steps);

    console.log('Steps after processing:', steps);

    const newProject = {
        id: generateId(),
        username: username,
        title: title,
        description: description,
        date: new Date().toLocaleDateString("en-US"),
        steps: steps,
    };
    projects.push(newProject);
    console.log('Project added into db:', newProject);
    return newProject;
}

// Function to get all projects from the database
function getAllProjects() {
    return projects;
}

// Function to get a project by its ID
function getProjectById(id) {
    return projects.find(project => project.id === id);
}

// Function to update a project
function updateProject(id, updatedProject) {
    const index = projects.findIndex(project => project.id === id);
    if (index !== -1) {
        projects[index] = { ...projects[index], ...updatedProject };
        return projects[index];
    }
    return null;
}

// Function to delete a project
function deleteProject(id) {
    const index = projects.findIndex(project => project.id === id);
    if (index !== -1) {
        projects.splice(index, 1);
        return true;
    }
    return false;
}

module.exports = {
    addProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
};
