const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const password = require("./password");

const connection = mysql.createConnection({
    host: "localHost",
    port: 3306,
    user: "root",
    password: password,
    database: "employeeDB"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    init();
});

function init() {
    inquirer.prompt({
        name: "initialize",
        type: "list",
        message: "What would you like to do?",
        choices: ["Add Department", "Add Role", "Add Employee", "View Departments", "View Roles", "View Employees", "Update Employee Role", "EXIT"]
    })
        .then(function (res) {
            switch (res.initialize) {
                case "Add Department":
                    addDepartment();
                    break;

                case "Add Role":
                    addRole();
                    break;

                case "Add Employee":
                    addEmployee();
                    break;

                case "View Departments":
                    viewDepartments();
                    break;
                case "View Roles":
                    viewRoles();
                    break;

                case "View Employees":
                    viewEmployees();
                    break;

                case "Update Employee Role":
                    updateEmployeeRole();
                    break;

                case "EXIT":
                    closeApp();
                    break;
            }
        })
}

function addDepartment() {
    inquirer.prompt({
        name: "department",
        type: "input",
        message: "What is the name of the department?"
    }).then(function (res) {
        connection.query(`INSERT INTO department (name) VALUES ('${res.department}')`, function (err, res) {
            if (err) throw err;
            console.log("Department has been added!");
            init();
        })
    })
}

function addRole() {
    connection.query("SELECT * FROM department", function (err, results) {
        if (err) throw err;
        inquirer.prompt([
            {
                name: "roleTitle",
                type: "input",
                message: "What is the title of the role?"
            },
            {
                name: "roleSalary",
                type: "input",
                message: "What is the base salary of the role?"
            },
            {
                name: "roleDepartment",
                type: "rawlist",
                message: "What is the department this role is a part of?",
                choices: function () {
                    let choiceArray = [];
                    results.forEach((entry) => {
                        let name = entry.name;
                        let value = entry.id;
                        choiceArray.push({ name, value });
                    });
                    return choiceArray;
                },
            }
        ]).then(function (res) {
            connection.query(`INSERT INTO role (title, salary, department_id) VALUES ('${res.roleTitle}', '${res.roleSalary}', '${res.roleDepartment}')`, function (err, res) {
                if (err) throw err;
                console.log("Role has been added!");
                init();
            })
        })

    }
    )
}

function addEmployee() {
    connection.query("SELECT * FROM role", function (err, results) {
        if (err) throw err;
        connection.query("SELECT * FROM employee", function(error, employeeRes) {
            if (error) throw error;
            inquirer.prompt([
                {
                    name: "employeeFirstName",
                    type: "input",
                    message: "What is the first name of the employee?"
                },
                {
                    name: "employeeLastName",
                    type: "input",
                    message: "What is the last name of the employee?"
                },
                {
                    name: "employeeRole",
                    type: "rawlist",
                    message: "What is the role ID of the employee?",
                    choices: function () {
                        let choiceArray = [];
                        results.forEach((entry) => {
                            let name = entry.title;
                            let value = entry.id;
                            choiceArray.push({ name, value });
                        });
                        return choiceArray;
                    },
                },
                {
                    name: "managerID",
                    type: "rawlist",
                    message: "Who is the employees manager?",
                    choices: function() {
                        let choiceArray = [];
                        employeeRes.forEach((entry) => {
                            let name = (entry.first_name + " " + entry.last_name);
                            let value = entry.id;
                            choiceArray.push({ name, value })
                        });
                        let name = "None";
                        let value = 0;
                        choiceArray.push({ name, value })
                        return choiceArray;
                    }
                }
            ]).then(function (res) {
                if (res.managerID === 0) {
                    res.managerID = null;
                }
                connection.query("INSERT INTO employee SET ?",
                    {
                        first_name: res.employeeFirstName,
                        last_name: res.employeeLastName,
                        role_id: res.employeeRole,
                        manager_id: res.managerID
                    },
                    function (err, res) {
                        if (err) throw err;
                        console.log("Employee has been added!");
                        init();
                    });
            });
        })
    });
}

function viewDepartments() {
    connection.query("SELECT * FROM department", function (err, res) {
        if (err) throw err;
        let table = cTable.getTable(res);
        console.log(table);
        init();
    })
}

function viewRoles() {
    connection.query("SELECT role.id, title, salary, name FROM role JOIN department ON role.department_id = department.id", function (err, res) {
        if (err) throw err;
        let table = cTable.getTable(res);
        console.log(table);
        init();
    })
}

function viewEmployees() {
    connection.query("SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, salary, CONCAT(manager.first_name, ' ', manager.last_name) AS 'manager_name' FROM employee LEFT JOIN role ON role.id = employee.role_id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON manager.id = employee.manager_id ORDER BY employee.id", function (err, res) {
        if (err) throw err;
        let table = cTable.getTable(res);
        console.log(table);
        init();
    })
}

function updateEmployeeRole() {
    connection.query("SELECT * FROM employee", function(err, res) {
        if (err) throw err;
        inquirer.prompt(
            {
                name: "updateEmployee",
                type: "rawlist",
                message: "Which employee role would you like to update?",
                choices: function () {
                    let choiceArray = [];
                    res.forEach((entry) => {
                        let name = ""
                        name = (entry.first_name + " " + entry.last_name);
                        let value = entry.id;
                        choiceArray.push({ name, value });
                    });
                    return choiceArray;
                }
            }
        ).then(function(answer) {
            connection.query("SELECT * FROM role", function(err, res) {
                if (err) throw err;
                inquirer.prompt(
                    {
                        name: "updateRole",
                        type: "rawlist",
                        message: "What would you like their new role to be?",
                        choices: function() {
                            let choiceArray = [];
                            res.forEach((entry) => {
                                let name = (entry.title);
                                let value = entry.id;
                                choiceArray.push({ name, value });
                            });
                            return choiceArray;
                        }
                    }
                ).then(function(roleAnswer) {
                    connection.query("UPDATE employee SET ? WHERE ?", [
                        {
                            role_id: roleAnswer.updateRole
                        },
                        {
                            id: answer.updateEmployee
                        }
                    ])
                    console.log("Employee role has been updated!")
                    init();
                })
            })
        });
    })
}

function closeApp() {
    inquirer.prompt({
        name: "confirm",
        type: "confirm",
        message: "Are you sure you want to terminate this application?"
    }).then(function (res) {
        if (res.confirm === true) {
            connection.end();
        } else {
            init();
        }
    })
}