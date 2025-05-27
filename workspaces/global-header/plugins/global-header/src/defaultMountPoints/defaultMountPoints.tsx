/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LogoutButton } from '../components/LogoutButton/LogoutButton';
import { CreateDropdown } from '../components/HeaderDropdownComponent/CreateDropdown';
import { ProfileDropdown } from '../components/HeaderDropdownComponent/ProfileDropdown';
import { RegisterAComponentSection } from '../components/HeaderDropdownComponent/RegisterAComponentSection';
import { SoftwareTemplatesSection } from '../components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { SearchComponent } from '../components/SearchComponent/SearchComponent';
import { SupportButton } from '../components/SupportButton/SupportButton';
import {
  ApplicationLauncherDropdownMountPoint,
  CreateDropdownMountPoint,
  GlobalHeaderComponentMountPoint,
  ProfileDropdownMountPoint,
} from '../types';
import { NotificationButton } from '../components/NotificationButton/NotificationButton';
import { Divider } from '../components/Divider/Divider';
import { MenuItemLink } from '../components/MenuItemLink/MenuItemLink';
import { Spacer } from '../components/Spacer/Spacer';
import { StarredDropdown } from '../components/HeaderDropdownComponent/StarredDropdown';
import { ApplicationLauncherDropdown } from '../components/HeaderDropdownComponent/ApplicationLauncherDropdown';
import { CompanyLogo } from '../components/CompanyLogo/CompanyLogo';

/**
 * default Global Header Components mount points
 *
 * @public
 */
export const defaultGlobalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    {
      Component: CompanyLogo,
      config: {
        priority: 200,
        props: {
          to: '/catalog',
          logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUxLjE5OSIgaGVpZ2h0PSI3OS45OTMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3R5bGU9ImZpbGw6I2ZmZiI+PHBhdGggZD0iTTYuMzA1MjI1OS0yLjgzMjlxMC0uNjIzMjM3OS0uMjI2NjMyLTEuMTU3NDQxOS0uMjE4NTM4LS41MzQyMDQtLjYxNTE0NC0uOTIyNzE2LS4zODg1MTItLjM5NjYwNi0uOTIyNzE2LS42MTUxNDQtLjUzNDIwNC0uMjI2NjMyLTEuMTU3NDQyLS4yMjY2MzItLjYyMzIzNzkgMC0xLjE1NzQ0MTkuMjI2NjMyLS41MzQyMDQuMjE4NTM4LS45MzA4MS42MTUxNDQtLjM4ODUxMjAyLjM4ODUxMi0uNjE1MTQ0MDEuOTIyNzE2LS4yMTg1MzguNTM0MjA0LS4yMTg1MzggMS4xNTc0NDE5IDAgLjYyMzIzOC4yMTg1MzggMS4xNTc0NDIuMjI2NjMxOTkuNTM0MjA0LjYxNTE0NDAxLjkzMDgxMDAxLjM5NjYwNi4zODg1MTIuOTMwODEuNjE1MTQzOTkuNTM0MjA0LjIxODUzOCAxLjE1NzQ0MTkuMjE4NTM4LjYyMzIzOCAwIDEuMTU3NDQyLS4yMTg1MzguNTM0MjA0LS4yMjY2MzE5OS45MjI3MTYtLjYxNTE0Mzk5LjM5NjYwNi0uMzk2NjA2MDEuNjE1MTQ0LS45MzA4MTAwMS4yMjY2MzItLjUzNDIwNC4yMjY2MzItMS4xNTc0NDJ6bS0uNTk4OTU2IDBxMCAuNTI2MTEtLjE3ODA2OC45NjMxODYtLjE3ODA2OC40Mjg5ODItLjQ4NTY0LjczNjU1NC0uMzA3NTcyLjMwNzU3MjAxLS43MzY1NTQuNDc3NTQ2MDEtLjQyODk4Mi4xNjk5NzQtLjkyMjcxNi4xNjk5NzQtLjUwMTgyNzkgMC0uOTMwODA5OS0uMTY5OTc0LS40MjA4ODgtLjE2OTk3NC0uNzI4NDYtLjQ3NzU0NjAxLS4zMDc1NzItLjMwNzU3Mi0uNDg1NjQtLjczNjU1NC0uMTc4MDY4LS40MzcwNzYtLjE3ODA2OC0uOTYzMTg2IDAtLjUyNjEwOTkuMTc4MDY4LS45NTUwOTE5LjE3ODA2OC0uNDM3MDc2LjQ4NTY0LS43NDQ2NDguMzA3NTcyLS4zMDc1NzIuNzI4NDYtLjQ3NzU0Ni40Mjg5ODItLjE2OTk3NC45MzA4MDk5LS4xNjk5NzQuNDkzNzM0IDAgLjkyMjcxNi4xNjk5NzR0LjczNjU1NC40Nzc1NDZxLjMwNzU3Mi4zMDc1NzIuNDg1NjQuNzQ0NjQ4LjE3ODA2OC40Mjg5ODIuMTc4MDY4Ljk1NTA5MTl6bS0uODI1NTg4IDEuNTEzNTc4LS42MzEzMzItMS4yMDYwMDZxLjI1OTAwOC0uMTIxNDEuNDEyNzk0LS4zMzk5NDguMTYxODgtLjIyNjYzMTkuMTYxODgtLjU5MDg2MTkgMC0uNTY2NTgtLjMzOTk0OC0uODAxMzA2dC0uODk4NDM0LS4yMzQ3MjZIMi4xNjEwOTh2My4xNzI4NDc5aC44NjYwNTc5Vi0yLjM4NzczaC4zNTYxMzZsLjUxODAxNiAxLjA2ODQwOHptLS45MzA4MS0yLjExMjUzMzlxMCAuMTY5OTc0LS4wOTcxMjguMjU5MDA4LS4wODkwMzQuMDg5MDM0LS4zMDc1NzIuMDg5MDM0aC0uNTE4MDE2di0uNjg3OTloLjUzNDIwNHEuMjEwNDQ0IDAgLjI5OTQ3OC4wOTcxMjguMDg5MDM0LjA4OTAzNC4wODkwMzQuMjQyODJ6IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzMzMzIDAgMCAxLjMzMzMzIDE2OS45NjYxIDcuNjczMTEpIiBhcmlhLWxhYmVsPSLCriIvPjxwYXRoIGQ9Ik0yNS42MjkxOTEtMTUuMjY1NzFxMC0zLjg3MDE4LTEuMDMyMDQ4LTYuNjY1MzA5LTEuMDMyMDQ4LTIuNzk1MTMtMi44ODExMzQtNC42MDEyMTQtMS44MDYwODQtMS44NDkwODYtNC4zNDMyMDEtMi43MDkxMjYtMi40OTQxMTYtLjg2MDA0LTUuNDYxMjU0LS44NjAwNEgzLjk1NjE4MzlWMGg3LjM1MzM0MjFxMy4wMTAxNCAwIDUuNjMzMjYyLS44MTcwMzc5OFExOS41NjU5MS0xLjY3NzA3OCAyMS41MDA5OTktMy41MjYxNjM5cTEuOTM1MDktMS44NDkwODYgMy4wMTAxNC00LjczMDIxOTkgMS4xMTgwNTItMi45MjQxMzYyIDEuMTE4MDUyLTcuMDA5MzI2MnptLTMuMzU0MTU2LjEyOTAwNnEwIDMuMjI1MTUtLjczMTAzNCA1LjU0NzI1ODItLjczMTAzNCAyLjI3OTEwNi0yLjEwNzA5NyAzLjc0MTE3MzktMS4zNzYwNjQgMS40NjIwNjgtMy4zMTExNTQgMi4xNTAxLTEuOTM1MDkuNjQ1MDMtNC4zODYyMDQuNjQ1MDNINy4zMTAzMzk4Vi0yNy4wNDgyNTdoNC4zNDMyMDIycTUuMjAzMjQyIDAgNy45MTIzNjggMy4wNTMxNDIgMi43MDkxMjUgMy4wNTMxNDIgMi43MDkxMjUgOC44NTg0MTF6TTUxLjA0MzQxNSAwdi0zLjA1MzE0MTloLTE1LjQ4MDcyVi0xNC41MzQ2NzZoOC42MDA0di0zLjA1MzE0MmgtOC42MDA0di05LjQ2MDQzOWgxNC44MzU2OXYtMy4wNTMxNDJIMzIuMjA4NTM5VjBabTI4LjU1MzMyMy0zMC4xMDEzOTloLTMuNDQwMTZMNjkuNDA1MjY0LTkuNTg5NDQ1OGwtLjUxNjAyNCAxLjU0ODA3MnEtLjI1ODAxMi44NjAwNC0uNTU5MDI2IDEuNzIwMDgtLjI1ODAxMi44NjAwMzk5LS40NzMwMjEgMS42MzQwNzU5LS4yMTUwMS43MzEwMzQtLjM0NDAxNiAxLjExODA1Mi0uMTI5MDA2LS4zODcwMTgtLjM0NDAxNi0xLjExODA1Mi0uMjE1MDEtLjczMTAzNC0uNDczMDIyLTEuNTQ4MDcxOS0uMjU4MDEyLS44NjAwNC0uNTU5MDI2LTEuNzIwMDgtLjI1ODAxMi0uODYwMDQtLjQ3MzAyMi0xLjU0ODA3Mkw1OC45NTU3NzktMzAuMTAxMzk5aC0zLjUyNjE2NEw2NS42NjQwOTEgMGgzLjY5ODE3MXpNMTA0LjYyMzg3IDB2LTMuMDUzMTQxOUg4OS4xNDMxNDlWLTE0LjUzNDY3Nmg4LjYwMDR2LTMuMDUzMTQyaC04LjYwMDR2LTkuNDYwNDM5aDE0LjgzNTY5MXYtMy4wNTMxNDJIODUuNzg4OTkzVjBabTI0LjY0MDE0IDB2LTMuMDUzMTQxOWgtMTQuODc4N1YtMzAuMTAxMzk5aC0zLjM1NDE1VjBabTI5LjA2OTM4LTE1LjA5MzcwMnEwLTMuMzk3MTU4LS45MDMwNC02LjIzNTI4OS0uOTAzMDQtMi44MzgxMzItMi41MzcxMi00LjkwMjIyOHQtMy45NTYxOC0zLjE4MjE0OHEtMi4yNzkxMS0xLjE2MTA1NC01LjA3NDI0LTEuMTYxMDU0LTIuNzk1MTMgMC01LjExNzI0IDEuMTYxMDU0LTIuMzIyMSAxLjE2MTA1NC0zLjk1NjE4IDMuMjI1MTV0LTIuNTM3MTIgNC45NDUyM3EtLjkwMzA0IDIuODM4MTMxLS45MDMwNCA2LjIzNTI4OSAwIDMuMzk3MTU4Ljg2MDA0IDYuMjM1MjkwMi45MDMwNCAyLjgzODEzMiAyLjUzNzEyIDQuOTAyMjI3OSAxLjYzNDA3IDIuMDY0MDk1OSAzLjkxMzE4IDMuMjI1MTQ5OTIgMi4zMjIxMSAxLjExODA1MTk3IDUuMTE3MjQgMS4xMTgwNTE5N3Q1LjExNzIzLTEuMTYxMDUzOTdxMi4zMjIxMS0xLjE2MTA1NDAyIDMuOTU2MTktMy4yMjUxNDk5MiAxLjY3NzA4LTIuMDY0MDk1OSAyLjU4MDEyLTQuOTAyMjI3OS45MDMwNC0yLjg4MTEzNDIuOTAzMDQtNi4yNzgyOTIyem0tMy4zNTQxNi4wODZxMCAyLjgzODEzMi0uNjg4MDMgNS4xNjAyNDAzLS42ODgwMyAyLjI3OTEwNTktMS44OTIwOSAzLjkxMzE4MTktMS4yMDQwNSAxLjU5MTA3MzktMi44ODExMyAyLjQ5NDExNTktMS42NzcwOC44NjAwNC0zLjYxMjE3Ljg2MDA0LTEuOTc4MDkgMC0zLjY1NTE3LS44NjAwNC0xLjY3NzA3LS45MDMwNDItMi45MjQxMy0yLjUzNzExNzktMS4yMDQwNi0xLjY3NzA3OC0xLjkzNTA5LTMuOTU2MTgzOS0uNjg4MDMtMi4zMjIxMDgzLS42ODgwMy01LjE2MDI0MDN0LjY4ODAzLTUuMTE3MjM3cS42ODgwMy0yLjMyMjEwOCAxLjg5MjA5LTMuOTEzMTgyIDEuMjA0MDUtMS42MzQwNzYgMi44MzgxMy0yLjQ5NDExNiAxLjY3NzA4LS45MDMwNDIgMy42MTIxNy0uOTAzMDQyIDEuOTc4MDkgMCAzLjY1NTE2LjkwMzA0MiAxLjY3NzA4Ljg2MDA0IDIuOTI0MTQgMi41MzcxMTggMS4yNDcwNiAxLjYzNDA3NiAxLjkzNTA5IDMuOTU2MTg0LjczMTAzIDIuMjc5MTA1LjczMTAzIDUuMTE3MjM3em0zMC44MzI0NC02LjEwNjI4M3EwLTIuMjc5MTA2LS43MzEwNC0zLjk1NjE4NC0uNzMxMDMtMS43MjAwOC0yLjAyMTA5LTIuODM4MTMyLTEuMjkwMDYtMS4xMTgwNTItMy4wNTMxNC0xLjYzNDA3Ni0xLjcyMDA4LS41NTkwMjYtMy43ODQxOC0uNTU5MDI2SDE2NC45NTU3VjBoMy4zNTQxNXYtMTEuODI1NTVoNy4zMTAzNHEyLjIzNjExIDAgNC4xMjgxOS0uNjAyMDI4IDEuODkyMDktLjYwMjAyOCAzLjIyNTE1LTEuNzYzMDgyIDEuMzMzMDctMS4yMDQwNTYgMi4wNjQxLTIuOTI0MTM2Ljc3NDA0LTEuNzYzMDgyLjc3NDA0LTMuOTk5MTg1em0tMy4zNTQxNi4xMjkwMDZxMCA2LjEwNjI4My02Ljc5NDMyIDYuMTA2MjgzaC03LjM1MzM0di0xMi4xNjk1NjVoNy43ODMzNnEzLjA5NjE1IDAgNC43MzAyMiAxLjU5MTA3NCAxLjYzNDA4IDEuNTQ4MDcyIDEuNjM0MDggNC40NzIyMDh6TTIxMC4zMjI4MSAwdi0zLjA1MzE0MTloLTE1LjQ4MDcyVi0xNC41MzQ2NzZoOC42MDA0di0zLjA1MzE0MmgtOC42MDA0di05LjQ2MDQzOWgxNC44MzU2OXYtMy4wNTMxNDJoLTE4LjE4OTg0VjBabTI3LjY5MzI5LTIxLjU4NzAwM3EwLTIuMTkzMTAyLS43MzEwMy0zLjc4NDE3Ni0uNzMxMDQtMS41OTEwNzQtMS45NzgxLTIuNjIzMTIyLTEuMjQ3MDUtMS4wNzUwNS0yLjk2NzEzLTEuNTkxMDc0dC0zLjY5ODE4LS41MTYwMjRoLTExLjkxMTU1VjBoMy4zNTQxNnYtMTIuODE0NTk2aDcuMTM4MzNMMjMzLjY3MjkgMGgzLjg3MDE4bC02LjYyMjMxLTEzLjA3MjYwOHEzLjIyNTE1LS42ODgwMzIgNS4xNjAyNC0yLjgzODEzMiAxLjkzNTA5LTIuMTUwMSAxLjkzNTA5LTUuNjc2MjYzem0tMy4zNTQxNi4xMjkwMDZxMCAyLjgzODEzMS0xLjYzNDA3IDQuMjU3MTk3LTEuNTkxMDggMS4zNzYwNjQtNC45NDUyMyAxLjM3NjA2NGgtNy45OTgzN3YtMTEuMjIzNTIxaDguNDI4MzlxMy4wMTAxNCAwIDQuNTU4MjEgMS40MTkwNjYgMS41OTEwNyAxLjM3NjA2NCAxLjU5MTA3IDQuMTcxMTk0ek0yNzcuNDkxOTIgMHYtMzAuMTAxMzk5aC0zLjM1NDE1djEyLjg1NzU5N2gtMTQuOTY0N3YtMTIuODU3NTk3aC0zLjM1NDE1VjBoMy4zNTQxNXYtMTQuMTkwNjZoMTQuOTY0N1YwWm0yOS4zNzAzNS0xMi4yOTg1NzJ2LTE3LjgwMjgyN2gtMy4zNTQxNXYxNy44ODg4MzFxMCA0LjkwMjIyODItMS42NzcwOCA3LjI2NzMzODEtMS42NzcwOCAyLjM2NTExLTUuNTkwMjYgMi4zNjUxMS03LjY5NzM2IDAtNy42OTczNi05LjcxODQ1MjF2LTE3LjgwMjgyN2gtMy4zNTQxNnYxNy44ODg4MzFxMCA2LjI3ODI5MjIgMi43MDkxMyA5LjUwMzQ0MjEgMi43NTIxMyAzLjE4MjE0Nzg5IDguMTcwMzggMy4xODIxNDc4OSA1LjQ2MTI1IDAgOC4xMjczOC0zLjIyNTE0OTg5IDIuNjY2MTItMy4yNjgxNTE5IDIuNjY2MTItOS41NDY0NDQxem0yOC4yNTIzIDMuMzk3MTU4MnEwLTEuODA2MDg0Mi0uNTE2MDMtMy4wOTYxNDQyLS41MTYwMi0xLjMzMzA2Mi0xLjMzMzA2LTIuMTkzMTAyLS44MTcwNC0uOTAzMDQyLTEuODQ5MDktMS40MTkwNjYtMS4wMzIwNC0uNTU5MDI2LTIuMDY0MDktLjgxNzAzOCAxLjkzNTA5LS42ODgwMzIgMy4xMzkxNC0yLjE1MDEgMS4yMDQwNi0xLjUwNTA2OSAxLjIwNDA2LTMuOTk5MTg1IDAtMS45MzUwOS0uNjAyMDMtMy4zNTQxNTYtLjYwMjAzLTEuNDE5MDY2LTEuNzIwMDgtMi4zMjIxMDgtMS4wNzUwNS0uOTQ2MDQ0LTIuNTgwMTItMS4zNzYwNjQtMS40NjIwNy0uNDczMDIyLTMuMjY4MTUtLjQ3MzAyMmgtMTEuMDA4NTFWMGgxMC43OTM1cTQuNzczMjIgMCA3LjI2NzM0LTIuMTkzMTAxOSAyLjUzNzEyLTIuMjM2MTA0IDIuNTM3MTItNi43MDgzMTE5em0tNC43NzMyMy0xMy41NDU2MjkycTAgMS45NzgwOTItMS4yMDQwNSAzLjM5NzE1Ny0xLjIwNDA2IDEuMzc2MDY0LTMuOTk5MTkgMS4zNzYwNjRoLTcuMjY3MzR2LTkuMzc0NDM1aDcuNTI1MzVxMi41MzcxMiAwIDMuNzQxMTggMS4yOTAwNiAxLjIwNDA1IDEuMjQ3MDU4IDEuMjA0MDUgMy4zMTExNTR6bTEuNDE5MDcgMTMuNzE3NjM3MnEwIDIuNTgwMTItMS40MTkwNyA0LjEyODE5MTktMS40MTkwNiAxLjU0ODA3Mi00LjgxNjIyIDEuNTQ4MDcyaC03LjY1NDM2Vi0xNC42NjM2ODJoNy40ODIzNXEyLjk2NzE0IDAgNC42ODcyMiAxLjU0ODA3MiAxLjcyMDA4IDEuNTQ4MDcyIDEuNzIwMDggNC4zODYyMDQyeiIgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMyAwIDAgMS4zMzMzMyAtNS4yMzcxNCA3OS4zNjI1NSkiIGFyaWEtbGFiZWw9IkRFVkVMT1BFUiBIVUIiLz48cGF0aCBkPSJtMTguNzkyMDI2IDAtMy45MjA4NC03LjQ3NzYwMjFxMS42MjQzNDgtLjcyODE1NjEgMi41NzY1NTItMi4xMjg0NTYxLjk1MjIwNC0xLjQwMDI5OTguOTUyMjA0LTMuNjEyNzczOCAwLTEuNzM2MzcyLS41NjAxMi0yLjk0MDYzLS41MzIxMTQtMS4yMzIyNjQtMS41NDAzMy0xLjk4ODQyNnQtMi40MzY1MjItMS4wOTIyMzRxLTEuNDAwMy0uMzY0MDc4LTMuMTA4NjY2LS4zNjQwNzhIMS45ODg0MjZWMGg1LjM0OTE0NjF2LTYuNjA5NDE2MWgyLjE4NDQ2ODFMMTIuNzE0NzI0IDBabS01Ljc5NzI0Mi0xMy4wNzg4MDJxMCAxLjA2NDIyOC0uNTYwMTIgMS42MjQzNDh0LTEuOTA0NDA4LjU2MDEySDcuMzM3NTcyMXYtNC4yODQ5MThoMy4yNzY3MDE5cTEuMjg4Mjc2IDAgMS44MjAzOS41ODgxMjYuNTYwMTIuNTg4MTI2LjU2MDEyIDEuNTEyMzI0ek0zNy4yMTk5NjUgMHYtNC41NjQ5NzgxaC05LjgzMDEwNnYtMy4zNjA3Mmg1Ljc5NzI0MnYtNC41MDg5NjU5aC01Ljc5NzI0MnYtMi42MDQ1NThoOS42MzQwNjRWLTE5LjYwNDJIMjIuMDEyNzA3VjBabTIwLjM4ODM2MS05LjkxNDEyNDJxMC0yLjc3MjU5MzgtLjcyODE1Ni00LjYyMDk4OTgtLjcwMDE1LTEuODQ4Mzk2LTIuMDE2NDMyLTIuOTY4NjM2LTEuMjg4Mjc2LTEuMTQ4MjQ2LTMuMTY0Njc4LTEuNjI0MzQ4LTEuODc2NDAyLS40NzYxMDItNC4xNzI4OTQtLjQ3NjEwMmgtNi44NjE0N1YwaDYuMzU3MzYycTIuNjA0NTU4IDAgNC41NjQ5NzgtLjUwNDEwODAxUTUzLjU3NTQ2Mi0xLjAzNjIyMiA1NC45MTk3NS0yLjE4NDQ2OHExLjM0NDI4OC0xLjE3NjI1MjEgMi4wMTY0MzItMy4wNTI2NTQxLjY3MjE0NC0xLjkwNDQwOC42NzIxNDQtNC42NzcwMDIxem0tNS41NzMxOTQuMDg0MDE4cTAgMS40NTYzMTItLjI1MjA1NCAyLjQ2NDUyODEtLjI1MjA1NC45ODAyMS0uODQwMTggMS41OTYzNDItLjU2MDEyLjU4ODEyNi0xLjQ1NjMxMi44NjgxODYtLjg5NjE5Mi4yNTIwNTQtMi4xNTY0NjIuMjUyMDU0aC0xLjE3NjI1MlYtMTQuOTU1MjA0aDEuMzQ0Mjg4cTEuMjYwMjcgMCAyLjEyODQ1Ni4zMDgwNjYuODY4MTg2LjI4MDA2IDEuNDAwMy44OTYxOTIuNTMyMTE0LjYxNjEzMi43NTYxNjIgMS41OTYzNDIuMjUyMDU0Ljk4MDIxLjI1MjA1NCAyLjMyNDQ5Nzh6IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzMzMzIDAgMCAxLjMzMzMzIC0yLjY1MTIzIDI3LjQzMDQ0KSIgYXJpYS1sYWJlbD0iUkVEIi8+PHBhdGggZD0iTTYuMzA1MjI1OS0yLjgzMjlxMC0uNjIzMjM3OS0uMjI2NjMyLTEuMTU3NDQxOS0uMjE4NTM4LS41MzQyMDQtLjYxNTE0NC0uOTIyNzE2LS4zODg1MTItLjM5NjYwNi0uOTIyNzE2LS42MTUxNDQtLjUzNDIwNC0uMjI2NjMyLTEuMTU3NDQyLS4yMjY2MzItLjYyMzIzNzkgMC0xLjE1NzQ0MTkuMjI2NjMyLS41MzQyMDQuMjE4NTM4LS45MzA4MS42MTUxNDQtLjM4ODUxMjAyLjM4ODUxMi0uNjE1MTQ0MDEuOTIyNzE2LS4yMTg1MzguNTM0MjA0LS4yMTg1MzggMS4xNTc0NDE5IDAgLjYyMzIzOC4yMTg1MzggMS4xNTc0NDIuMjI2NjMxOTkuNTM0MjA0LjYxNTE0NDAxLjkzMDgxMDAxLjM5NjYwNi4zODg1MTIuOTMwODEuNjE1MTQzOTkuNTM0MjA0LjIxODUzOCAxLjE1NzQ0MTkuMjE4NTM4LjYyMzIzOCAwIDEuMTU3NDQyLS4yMTg1MzguNTM0MjA0LS4yMjY2MzE5OS45MjI3MTYtLjYxNTE0Mzk5LjM5NjYwNi0uMzk2NjA2MDEuNjE1MTQ0LS45MzA4MTAwMS4yMjY2MzItLjUzNDIwNC4yMjY2MzItMS4xNTc0NDJ6bS0uNTk4OTU2IDBxMCAuNTI2MTEtLjE3ODA2OC45NjMxODYtLjE3ODA2OC40Mjg5ODItLjQ4NTY0LjczNjU1NC0uMzA3NTcyLjMwNzU3MjAxLS43MzY1NTQuNDc3NTQ2MDEtLjQyODk4Mi4xNjk5NzQtLjkyMjcxNi4xNjk5NzQtLjUwMTgyNzkgMC0uOTMwODA5OS0uMTY5OTc0LS40MjA4ODgtLjE2OTk3NC0uNzI4NDYtLjQ3NzU0NjAxLS4zMDc1NzItLjMwNzU3Mi0uNDg1NjQtLjczNjU1NC0uMTc4MDY4LS40MzcwNzYtLjE3ODA2OC0uOTYzMTg2IDAtLjUyNjEwOTkuMTc4MDY4LS45NTUwOTE5LjE3ODA2OC0uNDM3MDc2LjQ4NTY0LS43NDQ2NDguMzA3NTcyLS4zMDc1NzIuNzI4NDYtLjQ3NzU0Ni40Mjg5ODItLjE2OTk3NC45MzA4MDk5LS4xNjk5NzQuNDkzNzM0IDAgLjkyMjcxNi4xNjk5NzR0LjczNjU1NC40Nzc1NDZxLjMwNzU3Mi4zMDc1NzIuNDg1NjQuNzQ0NjQ4LjE3ODA2OC40Mjg5ODIuMTc4MDY4Ljk1NTA5MTl6bS0uODI1NTg4IDEuNTEzNTc4LS42MzEzMzItMS4yMDYwMDZxLjI1OTAwOC0uMTIxNDEuNDEyNzk0LS4zMzk5NDguMTYxODgtLjIyNjYzMTkuMTYxODgtLjU5MDg2MTkgMC0uNTY2NTgtLjMzOTk0OC0uODAxMzA2dC0uODk4NDM0LS4yMzQ3MjZIMi4xNjEwOTh2My4xNzI4NDc5aC44NjYwNTc5Vi0yLjM4NzczaC4zNTYxMzZsLjUxODAxNiAxLjA2ODQwOHptLS45MzA4MS0yLjExMjUzMzlxMCAuMTY5OTc0LS4wOTcxMjguMjU5MDA4LS4wODkwMzQuMDg5MDM0LS4zMDc1NzIuMDg5MDM0aC0uNTE4MDE2di0uNjg3OTloLjUzNDIwNHEuMjEwNDQ0IDAgLjI5OTQ3OC4wOTcxMjguMDg5MDM0LjA4OTAzNC4wODkwMzQuMjQyODJ6IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzMzMzIDAgMCAxLjMzMzMzIDQ0Mi43OTIyIDQ3LjA2NTIyKSIgYXJpYS1sYWJlbD0iwq4iLz48cGF0aCBkPSJNMTkuMTg0MTEgMHYtMTkuNjA0MmgtNS41NDUxODh2Ny4xNDE1M0g3LjUzMzYxNDF2LTcuMTQxNTNIMS45ODg0MjZWMGg1LjU0NTE4ODF2LTcuNzI5NjU2MWg2LjEwNTMwNzlWMFptMjIuNDg4ODMzIDAtNy4xMTM1MjQtMTkuNjA0MmgtNS40ODkxNzZMMjEuOTU2NzE5IDBoNS44MjUyNDhsMS4wNjQyMjgtMy40NDQ3MzgxaDUuODgxMjZMMzUuNzkxNjgzIDBabS04LjI2MTc3LTcuNzU3NjYyMWgtMy4yNDg2OTZsLjM2NDA3OC0xLjI4ODI3NjFxLjI1MjA1NC0uOTI0MTk4LjQ0ODA5Ni0xLjYyNDM0NzguMTk2MDQyLS43MDAxNS4zMzYwNzItMS4yNjAyNy4xNjgwMzYtLjU2MDEyLjI4MDA2LTEuMDM2MjIyLjExMjAyNC0uNDc2MTAyLjE5NjA0Mi0uOTgwMjEuMDg0MDIuNTA0MTA4LjE5NjA0Mi45ODAyMWwuMjUyMDU0IDEuMDA4MjE2cS4xNjgwMzYuNTYwMTIuMzY0MDc4IDEuMjYwMjcuMTk2MDQyLjcwMDE0OTguNDQ4MDk2IDEuNjUyMzUzOHptMjMuOTczMTEyLTcuMTEzNTIzOVYtMTkuNjA0Mkg0MC45NzI3Njh2NC43MzMwMTRoNS40ODkxNzdWMGg1LjQzMzE2NHYtMTQuODcxMTg2eiIgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMyAwIDAgMS4zMzMzMyA4OS45MDg3NyAyNy40MzA0NCkiIGFyaWEtbGFiZWw9IkhBVCIvPjwvZz48L3N2Zz4K',
        },
      },
    },
    {
      Component: SearchComponent,
      config: {
        priority: 100, // the greater the number, the more to the left it will be
      },
    },
    {
      Component: Spacer,
      config: {
        priority: 99, // the greater the number, the more to the left it will be
        props: {
          growFactor: 0,
        },
      },
    },
    // Notice: 1.5 ships with a Create link instead of a dropdown!!!
    {
      Component: CreateDropdown,
      config: {
        priority: 90,
        layout: {
          display: {
            sm: 'none',
            md: 'block',
          },
          mr: 1.5,
        } as any as React.CSSProperties, // I don't used MUI v5 specific `sx` types here to allow us changing the implementation later
      },
    },
    {
      Component: StarredDropdown,
      config: {
        priority: 85,
      },
    },
    {
      Component: ApplicationLauncherDropdown,
      config: {
        priority: 82,
      },
    },
    {
      Component: SupportButton,
      config: {
        priority: 80,
      },
    },
    {
      Component: NotificationButton,
      config: {
        priority: 70,
      },
    },
    {
      Component: Divider,
      config: {
        priority: 50,
      },
    },
    {
      Component: ProfileDropdown,
      config: {
        priority: 10, // the greater the number, the more to the left it will be
      },
    },
  ];

export const defaultCreateDropdownMountPoints: CreateDropdownMountPoint[] = [
  {
    Component: SoftwareTemplatesSection as React.ComponentType,
    config: {
      priority: 200,
    },
  },
  {
    Component: RegisterAComponentSection as React.ComponentType,
    config: {
      priority: 100,
    },
  },
];

export const defaultProfileDropdownMountPoints: ProfileDropdownMountPoint[] = [
  {
    Component: MenuItemLink as React.ComponentType,
    config: {
      priority: 200,
      props: {
        title: 'Settings',
        icon: 'manageAccounts',
        link: '/settings',
      },
    },
  },
  {
    Component: LogoutButton,
    config: {
      priority: 100,
    },
  },
];

export const defaultApplicationLauncherDropdownMountPoints: ApplicationLauncherDropdownMountPoint[] =
  [
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Red Hat AI',
        sectionLink: 'https://www.redhat.com/en/products/ai',
        sectionLinkLabel: 'Read more',
        priority: 200,
        props: {
          title: 'Podman Desktop',
          icon: 'https://podman-desktop.io/img/logo.svg',
          link: 'https://podman-desktop.io/',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Red Hat AI',
        priority: 180,
        props: {
          title: 'OpenShift AI',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Red_Hat_logo.svg',
          link: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/openshift-ai',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Quick Links',
        priority: 150,
        props: {
          title: 'Slack',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
          link: 'https://slack.com/',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Quick Links',
        priority: 130,
        props: {
          title: 'ArgoCD',
          icon: 'https://argo-cd.readthedocs.io/en/stable/assets/logo.png',
          link: 'https://argo-cd.readthedocs.io/en/stable/',
        },
      },
    },
  ];
