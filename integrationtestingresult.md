# Integration Test Cases

Integration test rerun command:

```bash
npm.cmd test -- --runInBand integration.test.js
```

Latest rerun result: `21` test suites passed, `49` tests passed.

## NavigationBar

| Field | Value |
| --- | --- |
| Module Name | `NavigationBar` |
| Test Title | Route Wiring, Selected State, Disabled State |
| Description | Verifies the composed navigation buttons render, route correctly, reflect selected state, and block disabled tabs. |
| Preconditions | The component can render in the Jest test environment. `onNavigate` and `Alert.alert` are mocked. Icon mocks are available. |
| Dependencies | `NavigationBar`, appointment/home/med/progress/notification button components, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the component and press all navigation buttons to verify route wiring. | `Appointments`, `Med tracker`, `Home`, `Progress report`, `Alerts` | Each button calls `onNavigate` with the correct tab key. | Each button triggered the expected route callback during rerun. | Pass |
| 2 | Render the component with a selected tab to verify selected state. | `selectedTab="notification"` | Alerts is selected and Home is not selected. | Selected state matched the expected accessibility state. | Pass |
| 3 | Render the component with disabled tabs and press them. | `appointmentDisabled`, `medDisabled`, `progressDisabled` | Disabled tabs do not call `onNavigate`. | Disabled tabs did not trigger navigation during rerun. | Pass |

## DashboardHeader

| Field | Value |
| --- | --- |
| Module Name | `DashboardHeader` |
| Test Title | Render, Handler Wiring, Disabled State |
| Description | Verifies the header greeting and the composed Profile and Help button behaviors. |
| Preconditions | The component can render in the Jest test environment. Profile and help handlers are mocked. |
| Dependencies | `DashboardHeader`, `ProfileButton`, `HelpButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the component and verify greeting and child controls. | `firstName="Jane"` | Greeting, Profile, and Help controls are visible. | Greeting and child controls rendered as expected. | Pass |
| 2 | Press Profile and Help to verify parent handler wiring. | Mock `onProfilePress`, mock `onHelpPress` | Each press fires the correct handler once. | Both handlers fired correctly during rerun. | Pass |
| 3 | Render with disabled child controls and press them. | `profileDisabled`, `helpDisabled` | Disabled controls do not fire handlers. | No handler calls were made for disabled controls. | Pass |

## Accessibility

| Field | Value |
| --- | --- |
| Module Name | `Accessibility` |
| Test Title | Render, Back Navigation |
| Description | Verifies the screen content renders and the back button uses navigation correctly. |
| Preconditions | Screen renders successfully and `navigation.goBack` is mocked. |
| Dependencies | `Accessibility`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the screen and verify the title and subtitle. | Static screen content | Accessibility title and subtitle are visible. | Screen content rendered correctly during rerun. | Pass |
| 2 | Press the back button. | Mock `navigation.goBack` | `goBack` is called once. | Back navigation fired correctly. | Pass |

## AccessibilitySettings

| Field | Value |
| --- | --- |
| Module Name | `AccessibilitySettings` |
| Test Title | Text Controls, Navigation |
| Description | Verifies the screen renders text-size controls and routes through the nav bar and back button. |
| Preconditions | Screen renders successfully and navigation methods are mocked. |
| Dependencies | `AccessibilitySettings`, `ActionButton`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the screen and interact with the text-size controls. | `Small`, `Medium`, `Large` | Controls render and remain interactable. | Text-size controls rendered and accepted presses. | Pass |
| 2 | Press a navigation bar item and the back button. | `Appointments`, Back | Screen routes to the appointment tracker and back works. | Navigation and back behavior matched expectations. | Pass |

## ApptTracker

| Field | Value |
| --- | --- |
| Module Name | `ApptTracker` |
| Test Title | Edit Appointment, Add Appointment, Navigation |
| Description | Verifies composed appointment cards, popup editing, add flow, and navigation bar routing. |
| Preconditions | Screen renders with sample appointments. Navigation is mocked. |
| Dependencies | `ApptTracker`, `ClickableCard`, `LargePopup`, `CrudButton`, `InputBar`, `ActionButton`, `NavigationBar`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Open appointment details, edit the concern, and save. | `Primary Care Follow-up` -> `Updated Follow-up` | Updated appointment detail is visible after save. | Updated detail appeared correctly during rerun. | Pass |
| 2 | Open the add-appointment popup, fill required fields, and submit. | `Vaccination`, `City Clinic`, `09171234567`, `2026-04-10`, `09:30` | New appointment appears in the list. | New appointment was added successfully. | Pass |
| 3 | Press a navigation bar target. | `Alerts` | Screen routes to the notification screen. | Navigation bar routing worked as expected. | Pass |

## EditProfileScreen

| Field | Value |
| --- | --- |
| Module Name | `EditProfileScreen` |
| Test Title | Save Dialog Open, Navigation |
| Description | Verifies the save action opens the confirmation dialog and that screen-level navigation controls work. |
| Preconditions | Screen renders successfully. Navigation is mocked. Keyboard listeners are mocked. |
| Dependencies | `EditProfileScreen`, `InputBar`, `DialogBox`, `ActionButton`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Change the full name and press the main save action. | `Janet Doe` | Confirmation dialog opens with the expected message. | Save action opened the confirmation dialog correctly. | Pass |
| 2 | Press a navigation bar item and the back button. | `Home`, Back | Screen routes home and back works. | Navigation and back handling matched expectations. | Pass |

## HelpAndSupport

| Field | Value |
| --- | --- |
| Module Name | `HelpAndSupport` |
| Test Title | Search Filter, Navigation |
| Description | Verifies FAQ filtering through the shared search component and screen routing behavior. |
| Preconditions | Screen renders with FAQ data and navigation is mocked. |
| Dependencies | `HelpAndSupport`, `SearchBar`, `NavigationBar`, `BackButton`, `TextCard`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Type a search term into the FAQ search bar. | `password` | Matching FAQ remains visible and unrelated FAQ is hidden. | FAQ filtering behaved as expected during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Alerts`, Back | Screen routes to notifications and back works. | Navigation and back behavior passed. | Pass |

## LinkRequestsPage

| Field | Value |
| --- | --- |
| Module Name | `LinkRequestsPage` |
| Test Title | Filter and Accept Request, Back Navigation |
| Description | Verifies request filtering, modal open flow, accept flow, and back button behavior. |
| Preconditions | Screen renders with request data. Navigation is mocked. |
| Dependencies | `LinkRequestsPage`, `SearchBar`, `CrudButton`, `ActionButton`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Filter the request list, open a request, and accept it. | Search `Jane` | Matching request appears, review dialog opens, accepted status is shown. | Request flow behaved correctly during rerun. | Pass |
| 2 | Press the back button. | Back | `goBack` is called once. | Back button behavior passed. | Pass |

## LinkToCaregiver

| Field | Value |
| --- | --- |
| Module Name | `LinkToCaregiver` |
| Test Title | Search and Request Flow, Navigation |
| Description | Verifies caregiver filtering, send-request flow, cancel-request flow, and navigation behavior. |
| Preconditions | Screen renders with caregiver data. Navigation is mocked. |
| Dependencies | `LinkToCaregiver`, local search input, `ActionButton`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Search caregivers, send a request, reopen the same caregiver, and cancel the request. | Search `Jane` | Filtered caregiver list appears, request sent status appears, cancel request status appears. | Search and request lifecycle passed during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Alerts`, Back | Screen routes to notifications and back works. | Navigation and back behavior passed. | Pass |

## LinktoPatientMainPage

| Field | Value |
| --- | --- |
| Module Name | `LinktoPatientMainPage` |
| Test Title | Filter and Send Request, Back Navigation |
| Description | Verifies patient filtering, send-request modal flow, and back button behavior. |
| Preconditions | Screen renders with patient data. Navigation is mocked. |
| Dependencies | `LinktoPatientMainPage`, `SearchBar`, `CrudButton`, `ActionButton`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Filter the patient list, open a patient request dialog, and send the request. | Search `Jane` | Matching patient remains visible, send-request dialog opens, request sent status appears. | Patient request flow passed during rerun. | Pass |
| 2 | Press the back button. | Back | `goBack` is called once. | Back button behavior passed. | Pass |

## LogIn

| Field | Value |
| --- | --- |
| Module Name | `LogIn` |
| Test Title | Submit, Back Navigation, Sign-Up Link |
| Description | Verifies the composed login form submits correctly and the screen-level navigation actions work. |
| Preconditions | Screen renders successfully. Navigation methods are mocked. |
| Dependencies | `LogIn`, `InputBar`, `ActionButton`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Fill the login form and press Log In. | `patient@gmail.com`, `Secret123` | Screen navigates to the home route. | Login route behavior passed during rerun. | Pass |
| 2 | Press the back button. | Back | `goBack` is called once. | Back button behavior passed. | Pass |
| 3 | Press the Sign Up prompt link. | `Sign Up` | Screen navigates to the sign-up route. | Sign-up link routing passed. | Pass |

## MainDashboardCaregiver

| Field | Value |
| --- | --- |
| Module Name | `MainDashboardCaregiver` |
| Test Title | Header and Action Routes, Search and Open Patient |
| Description | Verifies dashboard header actions, patient-management actions, search filtering, and patient opening behavior. |
| Preconditions | Screen renders with patient data. Navigation is mocked. |
| Dependencies | `MainDashboardCaregiver`, `DashboardHeader`, `CrudButton`, `SearchBar`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Press header actions and dashboard action cards. | Help, Profile, Add a patient, Review patient requests | Correct routes are fired for each action. | Header and action routing passed during rerun. | Pass |
| 2 | Search for a patient and open the filtered result. | Search `Andrea` | Filtered patient list appears and selected patient opens with params. | Search and patient-open behavior passed. | Pass |

## MedTracker

| Field | Value |
| --- | --- |
| Module Name | `MedTracker` |
| Test Title | Edit Medicine, Add Medicine, Navigation |
| Description | Verifies medicine-card popup editing, add flow, and navigation bar routing. |
| Preconditions | Screen renders with sample medicines. Navigation is mocked. |
| Dependencies | `MedTracker`, `ClickableCard`, `LargePopup`, `CrudButton`, `InputBar`, `ActionButton`, `NavigationBar`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Open a medicine, edit the name, and save. | `Metformin` -> `Metformin XR` | Updated medicine name is visible after save. | Edit and save flow passed during rerun. | Pass |
| 2 | Open the add-medicine popup, fill required fields, and submit. | `Aspirin`, `100 mg`, `10 tablets`, `7:00 AM` | New medicine appears in the list. | Add-medicine flow passed during rerun. | Pass |
| 3 | Press a navigation bar item. | `Home` | Screen routes to home. | Navigation bar routing passed. | Pass |

## NotificationScreen

| Field | Value |
| --- | --- |
| Module Name | `NotificationScreen` |
| Test Title | Render Feed, Navigation |
| Description | Verifies the notification feed renders and the screen routes through the nav bar and back button. |
| Preconditions | Screen renders with placeholder notifications. Navigation is mocked. |
| Dependencies | `NotificationScreen`, `ClickableCard`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the screen and verify feed content. | Notification title/body data | Notifications title and feed items are visible. | Feed rendered correctly during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Home`, Back | Screen routes home and back works. | Navigation and back behavior passed. | Pass |

## NotificationSettings

| Field | Value |
| --- | --- |
| Module Name | `NotificationSettings` |
| Test Title | Reminder Timing Update, Navigation |
| Description | Verifies reminder timing summary updates and screen routing behavior. |
| Preconditions | Screen renders with default reminder settings. Navigation is mocked. |
| Dependencies | `NotificationSettings`, `ToggleButton`, `DurationPicker`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Press the medicine on-time chip. | Default medicine timing | Summary updates to the on-time text. | Reminder timing summary updated correctly during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Progress report`, Back | Screen routes to the progress report screen and back works. | Navigation and back behavior passed. | Pass |

## PatientSpecificDashboard

| Field | Value |
| --- | --- |
| Module Name | `PatientSpecificDashboard` |
| Test Title | Patient Render and Header Actions, Feature and Nav Routes |
| Description | Verifies patient-specific rendering, dashboard header actions, feature-card routing, and bottom navigation routing. |
| Preconditions | Screen renders successfully with `currentParams.patientName`. Navigation is mocked. |
| Dependencies | `PatientSpecificDashboard`, `DashboardHeader`, `ClickableCard`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the screen with a patient name and press header actions. | `patientName="James Santos"` | Patient title renders and Help/Profile route correctly. | Patient render and header actions passed during rerun. | Pass |
| 2 | Press feature cards and a navigation bar item with patient params present. | `patientName="Andrea Santos"` | Feature cards route with patient payload and nav bar routes correctly. | Feature and nav routing passed during rerun. | Pass |

## PrivacySettings

| Field | Value |
| --- | --- |
| Module Name | `PrivacySettings` |
| Test Title | Render Permission Groups, Navigation |
| Description | Verifies privacy permission sections render and the screen routes through nav and back controls. |
| Preconditions | Screen renders successfully. Navigation is mocked. |
| Dependencies | `PrivacySettings`, `ToggleButton`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Render the screen and verify group titles and permission labels. | Permission group data | Group titles and sample permission labels are visible. | Privacy groups rendered correctly during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Med tracker`, Back | Screen routes to med tracker and back works. | Navigation and back behavior passed. | Pass |

## ProfileScreen

| Field | Value |
| --- | --- |
| Module Name | `ProfileScreen` |
| Test Title | Route Actions, Saved Dialog Timer |
| Description | Verifies profile action routes and the timed saved-dialog behavior. |
| Preconditions | Screen renders successfully. Navigation is mocked. Fake timers are enabled for the saved-dialog test. |
| Dependencies | `ProfileScreen`, `ActionButton`, `DialogBox`, `NavigationBar`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Press Edit Profile, Settings, and a navigation bar target. | `Edit Profile`, `Settings`, `Med tracker` | Correct navigation routes are called. | Route actions passed during rerun. | Pass |
| 2 | Render with a saved token and advance timers. | `changesSavedToken=101` | Saved dialog appears, then auto-hides after timer advance. | Saved dialog timer behavior passed. | Pass |

## ProgressReport

| Field | Value |
| --- | --- |
| Module Name | `ProgressReport` |
| Test Title | Popup Open and Close, Navigation |
| Description | Verifies report preview popup behavior and screen routing. |
| Preconditions | Screen renders with placeholder reports. Navigation is mocked. |
| Dependencies | `ProgressReport`, `ClickableCard`, `LargePopup`, `ActionButton`, `NavigationBar`, `BackButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Open a report preview and then close it. | `Weekly Medication Adherence` | Popup content appears, then closes correctly. | Popup open/close behavior passed during rerun. | Pass |
| 2 | Press a navigation bar item and the back button. | `Appointments`, Back | Screen routes to appointment tracker and back works. | Navigation and back behavior passed. | Pass |

## SettingsScreen

| Field | Value |
| --- | --- |
| Module Name | `SettingsScreen` |
| Test Title | Password Change, Delete Dialog, Nested Routes |
| Description | Verifies the settings form flows, delete-account confirmation, and nested route links. |
| Preconditions | Screen renders successfully. Navigation and `Alert.alert` are mocked. |
| Dependencies | `SettingsScreen`, `InputBar`, `ActionButton`, `DialogBox`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Fill the password-change form and submit it. | `Secret123`, `Secret456` | Success alert appears and both fields reset. | Password-change flow passed during rerun. | Pass |
| 2 | Open the delete-account dialog and confirm deletion. | Delete Account -> Yes | Dialog opens, status changes to inactive, delete alert appears. | Delete flow passed during rerun. | Pass |
| 3 | Press the nested settings options. | `Notifications`, `Privacy Settings`, `Accessibility` | Each option routes to the correct settings screen. | Nested settings routing passed during rerun. | Pass |

## SignUp

| Field | Value |
| --- | --- |
| Module Name | `SignUp` |
| Test Title | Patient Route, Caregiver Route, Log-In Link |
| Description | Verifies the sign-up form routes correctly for both roles and that the log-in prompt link works. |
| Preconditions | Screen renders successfully. Navigation is mocked. |
| Dependencies | `SignUp`, `TabBar`, `InputBar`, `ActionButton`, Jest, `@testing-library/react-native` |

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Complete the form as Patient and submit it. | `Patient`, `patient@gmail.com`, `Secret123` | Screen routes to the home route. | Patient sign-up routing passed during rerun. | Pass |
| 2 | Complete the form as Caregiver and submit it. | `Caregiver`, `caregiver@gmail.com`, `Secret123` | Screen routes to the caregiver home route. | Caregiver sign-up routing passed during rerun. | Pass |
| 3 | Press the Log In prompt link. | `Log In` | Screen routes to the login route. | Log-in link routing passed. | Pass |

