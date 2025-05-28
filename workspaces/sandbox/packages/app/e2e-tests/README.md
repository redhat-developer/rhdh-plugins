# Playwright Test Automation - README

This folder contains Playwright tests for automating the verification of the sandbox plugin. It covers the following functionalities:

1. **Homepage Layout and Welcome Text Verification**
2. **OpenShift Card Interaction**
3. **Activities Page and Article Popup Test**

## Prerequisites

Before running the tests, ensure that you have the following:

- **Node.js** (version >= 16.x) installed.
- **Playwright** installed as a dependency.
- **.env File** containing the necessary credentials and base URL.

### .env File Configuration

Ensure you have a `.env` file at the root(workspaces/sandbox/) of your project with the following variables:

```

SSO_USERNAME=<Your SSO ID>
SSO_PASSWORD=<Your SSO Password>
BASE_URL=<Your Base URL>
ENVIRONMENT=<dev or e2e-tests>
```

## Setup Instructions

### 1. Install Dependencies

Clone this repository (or set it up on your local machine) and install the required dependencies.

```bash
git clone <your-repository-url>
cd <your-repository-name>/workspaces/sandbox
yarn install
```

This will install Playwright and other necessary packages.

### 2. Verify the Environment Configuration

Ensure that the `.env` file is properly configured with valid credentials and the base URL for the tests.

---

## Running the Tests

### 1. **Via Command Line (CLI)**

To run the tests via the command line, follow these steps:

- Open a terminal and navigate to the project directory.

- Run the Playwright tests using the `yarn` command:

```bash
yarn playwright test
```

This will execute all the tests defined in your project. If you want to run tests in a specific file or directory, you can specify the path:

```bash
yarn playwright test <path-to-your-test-file>
```

For example:

```bash
yarn playwright test e2e-tests/app.test.ts
```

### 2. **Run Tests in Headless Mode**

By default, Playwright runs tests in headless mode, which means it won't show the browser window. This is useful for continuous integration (CI) environments or when running tests in the background.

```bash
yarn playwright test --headless
```

### 3. **Run Tests in UI Mode (With Browser Window)**

If you want to see the tests run in the browser, enabling the UI mode will allow you to watch the tests as they happen.

To enable UI mode, run:

```bash
yarn playwright test --headed
```

This will launch the browser and display the tests running interactively.

### 4. **Run Tests with `--ui` Flag (Interactive Mode)**

You can also run the tests using Playwright's **interactive mode** (UI mode), which provides an interface to interact with the test runs.

When you use the **`--ui`** flag:

- Playwright will launch an **interactive interface**.
- You can **see the individual steps of the test run**.
- You can **pause, step forward**, or **retry tests manually** through the UI.
- This mode is excellent for **debugging tests**, as you can visually inspect what’s going wrong during test execution.

To run tests in **interactive UI mode**:

```bash
yarn playwright test --ui
```

For running tests on specific browsers in UI mode:

- For **Chromium**:

  ```bash
  yarn playwright test --project=chromium --ui
  ```

- For **Firefox**:

  ```bash
  yarn playwright test --project=firefox --ui
  ```

- For **WebKit**:

  ```bash
  yarn playwright test --project=webkit --ui
  ```

---

## Playwright Test Runner (Playwright Extension)

You can also run tests directly from your browser using the **Playwright extension** for Visual Studio Code (VS Code).

### Steps to Use Playwright Extension in VS Code

1. **Install Playwright Test Extension**:

   - Open VS Code.
   - Go to the Extensions Marketplace and search for "Playwright Test".
   - Install the extension by Microsoft.

2. **Run Tests**:

   - Open the test file (`app.test.ts`).
   - Use the **Playwright Test** extension to run individual tests directly from the editor.

---

## Test File Structure

The test file you provided follows a structured approach with:

1. **Before All Hook (`beforeAll`)**: This sets up the browser context and performs the login functionality using credentials from the `.env` file.
2. **Test for Homepage**: Verifies that the homepage contains the expected layout and text content.
3. **Test for OpenShift Card Interaction**: Ensures the OpenShift card functionality works, including clicking the "Try it" button and verifying the resulting content.
4. **Test for Activities Page**: Verifies the activities page and interacts with the articles listed on the page, opening each article in a popup.

---

## Running in CI (Continuous Integration)

To run Playwright tests in a CI environment, you can add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "tests": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headless": "playwright test --headless",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:chromium": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit"
  }
}
```

Then, you can run the tests by simply running the following commands:

```bash
yarn tests
yarn test:headless
yarn test:debug
yarn test:ui
yarn test:headed
yarn test:chromium
yarn test:firefox
yarn test:webkit
```

---

## Additional Information

- **Playwright Documentation**: [Playwright Docs](https://playwright.dev/)
- **Debugging Playwright Tests**: [Debugging Guide](https://playwright.dev/docs/debug)

---
