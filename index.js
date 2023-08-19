const inquirer = require('inquirer');
const db = require('./db');

const mainMenu = async () => {
    const { action } = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'View department budget',  
            'Exit'
        ]
    });

    switch (action) {
        case 'View all departments':
            await viewAllDepartments();
            break;
        case 'View all roles':
            await viewAllRoles();
            break;
        case 'View all employees':
            await viewAllEmployees();
            break;
        case 'Add a department':
            await addDepartment();
            break;
        case 'Add a role':
            await addRole();
            break;
        case 'Add an employee':
            await addEmployee();
            break;
        case 'Update an employee role':
            await updateEmployeeRole();
            break;
        case 'View department budget':
            await viewDepartmentBudget();
            break;
        case 'Exit':
            process.exit();
    };
}

const viewAllEmployees = async () => {
    try {
        const query = `
            SELECT e.id, e.first_name, e.last_name, r.title AS role, 
                   d.name AS department, r.salary, 
                   CONCAT(m.first_name, ' ', m.last_name) AS manager
            FROM employee e
            LEFT JOIN role r ON e.role_id = r.id
            LEFT JOIN department d ON r.department_id = d.id
            LEFT JOIN employee m ON e.manager_id = m.id
        `;
        const [employees] = await db.query(query);
        console.table(employees);
        mainMenu();
    } catch (error) {
        console.error("Error viewing employees:", error);
        mainMenu();
    }
};

const viewAllDepartments = async () => {
    const [departments] = await db.query('SELECT * FROM department');
    console.table(departments);
    mainMenu();
};

const viewAllRoles = async () => {
    const [roles] = await db.query('SELECT * FROM role');
    console.table(roles);
    mainMenu();
};

const addDepartment = async () => {
    const { departmentName } = await inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'Enter the department name:'
    });

    await db.query('INSERT INTO department (name) VALUES (?)', [departmentName]);
    console.log('Department added successfully!');
    mainMenu();
};

const viewDepartmentBudget = async () => {
    try {
        const query = `
            SELECT d.name AS department, SUM(r.salary) AS total_budget
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            GROUP BY d.name
        `;
        const [budgets] = await db.query(query);
        console.table(budgets);
        mainMenu();
    } catch (error) {
        console.error("Error viewing department budgets:", error);
        mainMenu();
    }
};

const addRole = async () => {
    const [departments] = await db.query('SELECT * FROM department');

    const { title, salary, departmentId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'Enter the role title:'
        },
        {
            type: 'input',
            name: 'salary',
            message: 'Enter the role salary:'
        },
        {
            type: 'list',
            name: 'departmentId',
            message: 'Which department does this role belong to?',
            choices: departments.map(department => ({
                name: department.name,
                value: department.id
            }))
        }
    ]);

    await db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [title, salary, departmentId]);
    console.log('Role added successfully!');
    mainMenu();
};

const addEmployee = async () => {
    const [roles] = await db.query('SELECT * FROM role');
    const [managers] = await db.query('SELECT id, CONCAT(first_name, " ", last_name) AS manager_name FROM employee WHERE manager_id IS NULL');

    const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: 'Enter the employee first name:'
        },
        {
            type: 'input',
            name: 'lastName',
            message: 'Enter the employee last name:'
        },
        {
            type: 'list',
            name: 'roleId',
            message: 'Which role does this employee have?',
            choices: roles.map(role => ({
                name: role.title,
                value: role.id
            }))
        },
        {
            type: 'list',
            name: 'managerId',
            message: 'Who is this employee\'s manager?',
            choices: [...managers.map(manager => ({
                name: manager.manager_name,
                value: manager.id
            })),
            {
                name: "None",
                value: null
            }]
        }
    ]);

    await db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [firstName, lastName, roleId, managerId]);
    console.log('Employee added successfully!');
    mainMenu();
};

const updateEmployeeRole = async () => {
    const [employees] = await db.query('SELECT id, CONCAT(first_name, " ", last_name) AS employee_name FROM employee');
    const [roles] = await db.query('SELECT * FROM role');

    const { employeeId, roleId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Which employee do you want to update?',
            choices: employees.map(employee => ({
                name: employee.employee_name,
                value: employee.id
            }))
        },
        {
            type: 'list',
            name: 'roleId',
            message: 'Which is the new role for this employee?',
            choices: roles.map(role => ({
                name: role.title,
                value: role.id
            }))
        }
    ]);

    await db.query('UPDATE employee SET role_id = ? WHERE id = ?', [roleId, employeeId]);
    console.log('Employee role updated successfully!');
    mainMenu();
};

mainMenu();
