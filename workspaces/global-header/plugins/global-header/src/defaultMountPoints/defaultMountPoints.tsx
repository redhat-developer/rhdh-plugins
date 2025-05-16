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
          logo: 'data:image/jpeg;base64,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X9V1XKWWXijRhLak3ARc8mwrIOc5znOc5znOdYm0okyNmdbPXjtThauvDbZDpv7LPjIuAbnj6aAuvDbZDkpPWfnI+Dy4x3brw22Qcht7RkfB5ca7pdeG2yHrmRJC7Hjj3xN14bbIQNuPQyMdNLeO3uF0eG2yE03+oyM77FIijicUcKVUYOwm5nrsixlfbK+2V9sr7ZX2yvtlfbK+yUtUAmWbePckk6xko5opP7wLyBU9N67+LJnlaZEUUAlp9/3iQ3Q7mgABhkrM9LH8zVTopJizQ2/KYQ0lPXjg3bX7QbS+nGkItX94GTJ/UpEWJUpBuaFKXJ4ZqzYfkoA5pEvoBzlrWowbHHEbQdDKbFAN7i1Oy33CiJYBLwCeOWrYLevzeMcJgFYBoyjHrSVs1MecJcWqbxMGjADW+C6VG2YlS+AwMC4it7pllw72TU3uRRkYajSlp/uo45kJK7XIZqTeppBapQ2GaW2pI5AIVKDTTH3pKlKurcHRKx0o0bGOuWQCJJTLaizn2vPRghSuPcV6/TeNhQwe1WuXKaGEa1D9DzGCrtfXnmgSmtGnkyNntOWcVxH82UAAQGmbWGBCODSg3EdR0pkCJiOSLJbAChQ2LoHWjPNtgfJSD/R+QbKT623E/QoJCSVOGf4xUv2We1cj2CG65b8kqB7rdlQDheMUWfpeRMJqmUW6/C1iF6fPXvUp8ULDohXkHzWNdQaekB1X4ofaI6ilW5J6YVynBAf9Sf/aAAwDAQACAAMAAAAQ888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888coxRTzhuD8888888888888884YAAAAAAARq8888888888888bhAAAAAAAAAF988888888888GDAAAGb/ACzgBxPPPPPPPPPPPPMQAAEGvPPNGTvPPPPPPPPPPPEL5gBRfPPPPPPPPPPPPPPPPPPC/vrcPPPBDjjjjjjgfPPPPPPPNvvqfPPPAfPvvvvvrPPPPPPPPF/vu/PPPAf/AP8A/wD/AP8A588888888e++v8888B//AP8A/wD/AP8AnzzzzzzzzL7yIPzzwfLLLPf/APk88888888W3gCxY888888k/wD/AMvzzzzzzzzwgIIPVjzzzxJ7/wD4K888888888QACCCwiyzQh1//AJfPPPPPPPPPPMCAgggggggggIfPPPPPPPPPPPPGhQwggggghl3PPPPPPPPPPPPPPPI6wjCQloPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP/xAAqEQABAgMHBAIDAQAAAAAAAAABABEhUWEgMDFBcZHREKGxwYHhQGDw8f/aAAgBAwEBPxD9sAfBAwFRB2xUTOVID2Vg4nVz5QDwDhYx8Abws3nQ8ugxCGWB47o1OKR/AZlAYk4BBgyqfUrhsYjuNCgp9wNaVvnyYDifQqh1oF0bmYDvQIPICcBleZxWJkMyg4sFhicP7JF2JqgPZRfgO5QiW2z6I9olByGB+/joRHYDvQLDQGAl9zN78g9BkPdg4Y+c5DkouKIzsAtggUXKOY5CwsBgMh91vZE56J7LIUxhJx0jnIoJ8Ikk5/EdlodASC4QAHfnlGNgTDQYWAjkyot1Rbqi3VFuqLdUW6ot1iZ7lsjM9WGl5hZ8gTp06dOnTpmYHu5w9T18bzZ8ouPCbl8hI8dWCl4jZ8ouHiMgfVyzMR6ERWAzRzJ2Gc2lEPPc9bAZlwqXZUuypdk1l2RCBg/WNpi5k7noj5gO5oEyNET16TpdqoEEOLYsyeLDUTiY3TwhYwo2VjOHuH0nAuLMCF5OUSncnqQQ/wAEABhdFv8AkUSBiLEDAqDC7EM7v+kfnKDsWCkPtOso9YdRdheS6GBR2JiLoyQgYZD3fN90OYR12eYe7hgDlHREMshz+DGCGMwogI6wWP7WKMxsVgxrCQGp4dRI37KCAP23/8QAKBEAAQIDCAIDAQEAAAAAAAAAAQARITAxECBBUWFxkbGhwUCB8dFg/9oACAECAQE/EP8AWwl3OiLpA8qqJqeVQjVUioILIa5OPgO7goeIDKQec2WAPadqgp4DmUK1UcZF2mFajusbh1hdF1t5QS/IURIhYxVM0VxM1zsCb7xuFww7Qhhhdw1PhNerObnEzDcwUJw97oY7Z/lmShU+IcNiST9QHdhzBGIToV8DnughuDrC50Wv4K1/BWv4K1/BWv4K1/BWv4KrENw0kmUnZtGRo78Ru9z0mCYJgmCYJgmCfynYGT4g6tb9Z6u9z1IHzEkmWngtaAxR25hd7nqQ0LMPckoLAkH7iOrAADkoRitUDLdNJuPIA6L9Ir9Ir9IoFgOQoujsD72wt8+pOcJDjcRCjpHrdfdhy2shxoVW+YAPYcBchykH98yhFgCctnjcPkEFcroGQ9joNUADYC0hcKb4IhCqZQ3CLcA65Ieh0xCWCQF0dYYqgXb+kMcCwDh7jMAOqOtKGxsOI2QcSiJpDLfOcJZIlUSDrAhYk/BiDMhKkQ4LVIHQisENU6CsH+t//8QAKxABAAECBAQHAQEAAwAAAAAAAREAMSFBUWEwQIGhECBxkbHB8NFQgOHx/9oACAEBAAE/EP8AlAHhO9NBMnIhfQcXpS6W/wDqR7DUoOyXLoB808z6lHuaRlPoVPyP1T2JNP4KhYzOWdkpyA8zdwPmsrFmdqe6rLNBTqU1K2xoMP8ACXlSVUBVk9JcLvZ7TSrKthQ3v9op0BSonqvCG62CXrF+tGM2CIftg9qBQJjhfRv0ojLn2Jim1F6MwvG7L0oKQuIhN9evHbC0iQjScFwSYezn1oJroQuiZc85VwoGqtI494UfUd/SlLkSqyvJMZe6wGiWSsAgXsbzc93SaLc2c0pVuugZtJhKxP8A2X45VsLSiEdSijVDBtQm2udG5zMtVA+DemyFQ3ANXV5Z44yuCz8xzoL4hIAMqk8uULtpJgAutN1GLU9f1tw0IRdihQVs/HFIEpH4yo6f3RiUiXE884EiYKPz1oDKgIAMjmkWLGutk6rvtrwUDFAJWjxxSTLNv6qDS3Xk2+xaMwr9AVAye1QaFISEJ6VJmXReyh71lxJ/6B3og6cO86dfJPRM2CigSRAQAZFZcykiJNzbf2lSFc4q8CCyiDdA1aKGphRbtp0qAwjgDXaAJEozMUrE20ad68HhKVvsghf5fOjfiGgAy5vAYrnl33aUiMOD5yhvKynY1ajKCeAKOhwB8MDrROCoQjubKNmYAIArKZ5mKYDjAbralBlFXVokF22fxafqEIeWe5xLPlvPYozOj4AZU/47hV45x9j78cM9MK5WOi3C8SPGm1quwY0IQLFi116v+SoFQYz0Zg+Z8go0xGmc2n7Nt/DNuJy2Z9VHnmmpdKl0qXSpdKl0qXSpdKl0qXSpdKl0qXSpdKl0o5FoU7J7SaZklWV8qCIkjcoCg0yGW5p6UUzA3NjF96DHgNw8FisNuOQhCEIQhCEIQhPRBWUhZHEeRZ6hB7wPafOChIL6W4OfI7SIyinfkdD2W7L9ecGNj7gz9cEvyOyzn9fyI2HJ+zzgLmn4eCX5HZUsse/98icXT7POCOY3Z4JfkdgzTg4PIm9E7J9+cpKz7WPvgl+R2/HoP1yMDMQe1F7T58ZolXW1HAz5EZGCFL2DsHINHYyPqRRNQkJv5VAVQC61CsKuXBsUXhWRkxie9a+dpaViQILYHBceeeeccMxXXlcibvnmAhQaIL3XkWLVBZHQWL5nyXugLT+yHy/zwmxWLI3/ABPIzxkbQCWkUzEek4dvMZzOF5QE0DQAgDLkWIqTO0+1z9v44ySYDi1YRWbeJwpr/Xo2o6mGJcRuuPCMawwsUDjmP152kBBpg+yelGPIzNG1i0OjlRMwqJvUm7Ju/q08IpVfKelED2O53o51lpEo4pOZYc9A3aYlBxPgdjzrBUKfpHeay5MbICXAbm08Adj+LFf4kzoc0SuZ8MuDjQr/AJV+lo9f0XfzaGXv510CRbt6K0AgbFF+TDYJTy7NK4XcWTgYoyxs/wA3elekxMM7s6HTgNCXgxMy30rG/ct627vwHvmyF1d6cs5nQDYjb1me3pwSSgZEYSj8KYx0NrqHW93uZj2oAU3/AKBehjAVDU96LggurEU+WroPYJaCFFnuLj2ovDgnhG91LWpKkr4Dr5mEj+hmuwY1F4PLVmvq8rhJjR1kIRMEpea5gXM+2ntwxSzFCQLv/BoKEGj/AHpmVd9+aVb+YfICsBK1gAli5cPU3ehrzCJEhL05gVmLu35UYoZ8Gi1YG/WaGVFuZi0uB3NGh4wlEsraPrZ5YXBQCHc/k0fAUAIA5t13ApBuJWNDKsfU5m16QO0AhHkklXEsrsUCgRdaLrdra6UAAAAsHOZRHhhZ/Awvozp6YuBojcucgG2jiUSbF2iKDEGl+mhUX/wGQEwRJGm28ZbF3saVCOy8H1fS01M7vLo8Im32cvYqCL7ywPR9pSt4V+HawogAACwf4ZVynzVlD7NM5mSDuB0KcoJlM7H6pZgsoZ3o77MPloZhLdqd89fE0iZmhX070gJ2Yu5X4qMLWX2IXtRcysb2isTCDwP+UP8A/9k=',
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
