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

import { useState } from 'react';
import {
  Accordion,
  AccordionGroup,
  AccordionPanel,
  AccordionTrigger,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  ButtonIcon,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Combobox,
  DatePicker,
  DateRangePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  Flex,
  Grid,
  Link,
  List,
  ListRow,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  NumberField,
  PasswordField,
  Popover,
  Radio,
  RadioGroup,
  SearchAutocomplete,
  SearchAutocompleteItem,
  SearchField,
  Select,
  Skeleton,
  Slider,
  SubmenuTrigger,
  Switch,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TagGroup,
  Tag,
  Text,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  VisuallyHidden,
} from '@backstage/ui';

import CloudIcon from '@mui/icons-material/Cloud';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BugReportIcon from '@mui/icons-material/BugReport';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Flex direction="column" gap="4">
    <Text as="h2" variant="title-medium" weight="bold">
      {title}
    </Text>
    <Box bg="neutral" p="4">
      {children}
    </Box>
  </Flex>
);

const AccordionExample = () => (
  <Section title="Accordion">
    <AccordionGroup allowsMultiple>
      <Accordion defaultExpanded>
        <AccordionTrigger
          title="First Panel"
          subtitle="This panel is open by default"
        />
        <AccordionPanel>
          <Text>Content of the first panel.</Text>
        </AccordionPanel>
      </Accordion>
      <Accordion>
        <AccordionTrigger title="Second Panel" />
        <AccordionPanel>
          <Text>Content of the second panel.</Text>
        </AccordionPanel>
      </Accordion>
      <Accordion>
        <AccordionTrigger title="Third Panel" />
        <AccordionPanel>
          <Text>Content of the third panel.</Text>
        </AccordionPanel>
      </Accordion>
    </AccordionGroup>
  </Section>
);

const AlertExample = () => (
  <Section title="Alert">
    <Flex direction="column" gap="4">
      <Alert
        status="info"
        icon
        title="This is an informational alert."
        description="Additional details about this alert."
      />
      <Alert
        status="success"
        icon
        title="Your changes have been saved successfully."
      />
      <Alert
        status="warning"
        icon
        title="This action may have unintended consequences."
      />
      <Alert
        status="danger"
        icon
        title="An error occurred while processing your request."
      />
      <Alert status="info" icon isPending title="Processing your request..." />
    </Flex>
  </Section>
);

const AvatarExample = () => (
  <Section title="Avatar">
    <Flex gap="4" align="center">
      <Avatar
        size="x-small"
        src="https://api.dicebear.com/6.x/open-peeps/svg?seed=Alice"
        name="Alice Johnson"
      />
      <Avatar
        size="small"
        src="https://api.dicebear.com/6.x/open-peeps/svg?seed=Bob"
        name="Bob Smith"
      />
      <Avatar
        size="medium"
        src="https://api.dicebear.com/6.x/open-peeps/svg?seed=Carol"
        name="Carol Williams"
      />
      <Avatar
        size="large"
        src="https://api.dicebear.com/6.x/open-peeps/svg?seed=Dave"
        name="Dave Brown"
      />
      <Avatar
        size="x-large"
        src="https://api.dicebear.com/6.x/open-peeps/svg?seed=Eve"
        name="Eve Martinez"
      />
      <Avatar size="medium" src="" name="Fallback Initials" />
    </Flex>
  </Section>
);

const BadgeExample = () => (
  <Section title="Badge">
    <Flex gap="2" align="center">
      <Badge size="small">Small</Badge>
      <Badge size="medium">Medium</Badge>
      <Badge icon={<BugReportIcon fontSize="small" />}>With Icon</Badge>
    </Flex>
  </Section>
);

const BoxExample = () => (
  <Section title="Box">
    <Flex direction="column" gap="4">
      <Box p="4" bg="neutral">
        <Text>bg=neutral</Text>
      </Box>
      <Box p="4" bg="danger">
        <Text>bg=danger</Text>
      </Box>
      <Box p="4" bg="warning">
        <Text>bg=warning</Text>
      </Box>
      <Box p="4" bg="success">
        <Text>bg=success</Text>
      </Box>
    </Flex>
  </Section>
);

const ButtonIconExample = () => (
  <Section title="ButtonIcon">
    <Flex gap="2" align="center">
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="primary"
        aria-label="Cloud primary"
      />
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="secondary"
        aria-label="Cloud secondary"
      />
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="tertiary"
        aria-label="Cloud tertiary"
      />
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="primary"
        size="medium"
        aria-label="Cloud medium"
      />
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="primary"
        isDisabled
        aria-label="Cloud disabled"
      />
      <ButtonIcon
        icon={<CloudIcon fontSize="small" />}
        variant="primary"
        isPending
        aria-label="Cloud pending"
      />
    </Flex>
  </Section>
);

const ButtonLinkExample = () => (
  <Section title="ButtonLink">
    <Flex gap="2" align="center">
      <ButtonLink href="https://backstage.io" target="_blank">
        Visit Backstage
      </ButtonLink>
      <ButtonLink
        href="https://backstage.io"
        target="_blank"
        variant="secondary"
      >
        Secondary Link
      </ButtonLink>
    </Flex>
  </Section>
);

const CardExample = () => (
  <Section title="Card">
    <Flex gap="4">
      <Card style={{ width: '250px' }}>
        <CardHeader>Static Card</CardHeader>
        <CardBody>
          <Text>Card body content goes here.</Text>
        </CardBody>
        <CardFooter>
          <Text variant="body-small" color="secondary">
            Footer
          </Text>
        </CardFooter>
      </Card>
      <Card
        style={{ width: '250px' }}
        onPress={() => {}}
        label="Interactive card"
      >
        <CardHeader>Clickable Card</CardHeader>
        <CardBody>
          <Text>Click anywhere on this card.</Text>
        </CardBody>
        <CardFooter>
          <Button size="small" variant="secondary" onPress={() => {}}>
            Action
          </Button>
        </CardFooter>
      </Card>
      <Card
        style={{ width: '250px' }}
        href="https://backstage.io"
        label="Link card"
      >
        <CardHeader>Link Card</CardHeader>
        <CardBody>
          <Text>This card navigates to a URL.</Text>
        </CardBody>
      </Card>
    </Flex>
  </Section>
);

const CheckboxGroupExample = () => (
  <Section title="CheckboxGroup">
    <Flex gap="6">
      <CheckboxGroup label="Notifications" defaultValue={['github']}>
        <Checkbox value="github">GitHub</Checkbox>
        <Checkbox value="slack">Slack</Checkbox>
        <Checkbox value="email">Email</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup
        label="Horizontal"
        orientation="horizontal"
        defaultValue={['a']}
      >
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
        <Checkbox value="c">Option C</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Disabled" isDisabled defaultValue={['a']}>
        <Checkbox value="a">Option A</Checkbox>
        <Checkbox value="b">Option B</Checkbox>
      </CheckboxGroup>
    </Flex>
  </Section>
);

const ComboboxExample = () => (
  <Section title="Combobox">
    <Flex gap="4">
      <Combobox
        name="font"
        label="Font Family"
        description="Choose a font family"
        options={[
          { id: 'sans', label: 'Sans-serif' },
          { id: 'serif', label: 'Serif' },
          { id: 'mono', label: 'Monospace' },
          { id: 'cursive', label: 'Cursive' },
        ]}
      />
      <Combobox
        name="font-disabled"
        label="Disabled"
        isDisabled
        options={[{ id: 'sans', label: 'Sans-serif' }]}
      />
      <Combobox
        name="font-sections"
        label="With Sections"
        options={[
          {
            title: 'Serif Fonts',
            options: [
              { id: 'times', label: 'Times New Roman' },
              { id: 'georgia', label: 'Georgia' },
            ],
          },
          {
            title: 'Sans-Serif Fonts',
            options: [
              { id: 'arial', label: 'Arial' },
              { id: 'helvetica', label: 'Helvetica' },
            ],
          },
        ]}
      />
    </Flex>
  </Section>
);

const DatePickerExample = () => (
  <Section title="DatePicker & DateRangePicker">
    <Flex gap="4" direction="column">
      <Flex gap="4">
        <DatePicker label="Small date" size="small" />
        <DatePicker label="Medium date" size="medium" />
        <DatePicker label="Disabled" isDisabled />
      </Flex>
      <Flex gap="4">
        <DateRangePicker label="Small range" size="small" />
        <DateRangePicker label="Medium range" size="medium" />
        <DateRangePicker label="Disabled" isDisabled />
      </Flex>
    </Flex>
  </Section>
);

const DialogExample = () => (
  <Section title="Dialog">
    <DialogTrigger>
      <Button>Open Dialog</Button>
      <Dialog>
        <DialogHeader>Example Dialog</DialogHeader>
        <DialogBody>
          <Text>This is the dialog body content.</Text>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" slot="close">
            Cancel
          </Button>
          <Button variant="primary" slot="close">
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  </Section>
);

const GridExample = () => (
  <Section title="Grid">
    <Grid.Root columns="4" gap="4">
      <Grid.Item colSpan="2">
        <Box p="4" bg="neutral">
          <Text>Spans 2 columns</Text>
        </Box>
      </Grid.Item>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
      <Box p="4" bg="neutral">
        <Text>1 col</Text>
      </Box>
    </Grid.Root>
  </Section>
);

const LinkExample = () => (
  <Section title="Link">
    <Flex gap="4" align="center">
      <Link href="#">Default link</Link>
      <Link href="#" weight="bold">
        Bold link
      </Link>
      <Link href="#" standalone>
        Standalone link
      </Link>
      <Link href="#" color="secondary">
        Secondary
      </Link>
      <Link href="#" color="danger">
        Danger
      </Link>
      <Link href="#" color="success">
        Success
      </Link>
    </Flex>
  </Section>
);

const ListExample = () => {
  const items = [
    {
      id: 'react',
      label: 'React',
      description: 'A JavaScript library for building user interfaces',
      icon: <StarIcon fontSize="small" />,
    },
    {
      id: 'typescript',
      label: 'TypeScript',
      description: 'Typed superset of JavaScript',
      icon: <CloudIcon fontSize="small" />,
    },
    {
      id: 'backstage',
      label: 'Backstage',
      description: 'An open platform for building developer portals',
      icon: <FavoriteIcon fontSize="small" />,
    },
  ];

  return (
    <Section title="List">
      <List aria-label="Technologies" items={items}>
        {item => (
          <ListRow id={item.id} icon={item.icon} description={item.description}>
            {item.label}
          </ListRow>
        )}
      </List>
    </Section>
  );
};

const MenuExample = () => (
  <Section title="Menu">
    <Flex gap="4">
      <MenuTrigger>
        <Button variant="secondary">Simple Menu</Button>
        <Menu>
          <MenuItem>New File</MenuItem>
          <MenuItem>Open</MenuItem>
          <MenuItem>Save</MenuItem>
        </Menu>
      </MenuTrigger>
      <MenuTrigger>
        <Button variant="secondary">With Sections</Button>
        <Menu>
          <MenuSection title="File">
            <MenuItem iconStart={<InsertDriveFileIcon fontSize="small" />}>
              New
            </MenuItem>
            <MenuItem iconStart={<FolderIcon fontSize="small" />}>
              Open
            </MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection title="Edit">
            <MenuItem>Cut</MenuItem>
            <MenuItem>Copy</MenuItem>
            <MenuItem>Paste</MenuItem>
          </MenuSection>
        </Menu>
      </MenuTrigger>
      <MenuTrigger>
        <Button variant="secondary">With Submenu</Button>
        <Menu>
          <MenuItem>New File</MenuItem>
          <SubmenuTrigger>
            <MenuItem>Open Recent</MenuItem>
            <Menu placement="right top">
              <MenuItem>File 1.txt</MenuItem>
              <MenuItem>File 2.txt</MenuItem>
              <MenuItem>File 3.txt</MenuItem>
            </Menu>
          </SubmenuTrigger>
          <MenuItem>Save</MenuItem>
        </Menu>
      </MenuTrigger>
      <MenuTrigger>
        <ButtonIcon
          icon={<MoreVertIcon fontSize="small" />}
          variant="tertiary"
          aria-label="More actions"
        />
        <Menu>
          <MenuItem>Settings</MenuItem>
          <MenuItem color="danger">Delete</MenuItem>
        </Menu>
      </MenuTrigger>
    </Flex>
  </Section>
);

const NumberFieldExample = () => (
  <Section title="NumberField">
    <NumberField
      label="Quantity"
      size="small"
      placeholder="Enter a number"
      minValue={0}
      maxValue={100}
      step={1}
    />
    <NumberField
      label="With Icon"
      size="medium"
      icon={<AccessTimeIcon fontSize="small" />}
      placeholder="Minutes"
      minValue={0}
      maxValue={59}
    />
    <NumberField label="Disabled" isDisabled defaultValue={5} />
  </Section>
);

const PasswordFieldExample = () => (
  <Section title="PasswordField">
    <Flex gap="4">
      <PasswordField label="Password" size="small" name="password-small" />
      <PasswordField
        label="With Icon"
        size="medium"
        name="password-medium"
        icon={<LockIcon fontSize="small" />}
        description="Must be at least 8 characters"
      />
      <PasswordField label="Disabled" name="password-disabled" isDisabled />
    </Flex>
  </Section>
);

const PopoverExample = () => (
  <Section title="Popover">
    <Flex gap="4">
      <DialogTrigger>
        <Button variant="secondary">Open Popover</Button>
        <Popover>
          <Box p="4">
            <Text>This is popover content.</Text>
          </Box>
        </Popover>
      </DialogTrigger>
      <DialogTrigger>
        <Button variant="secondary">Bottom Placement</Button>
        <Popover placement="bottom">
          <Box p="4">
            <Text>Bottom popover.</Text>
          </Box>
        </Popover>
      </DialogTrigger>
    </Flex>
  </Section>
);

const RadioGroupExample = () => (
  <Section title="RadioGroup">
    <Flex gap="6">
      <RadioGroup label="Favorite pokemon">
        <Radio value="bulbasaur">Bulbasaur</Radio>
        <Radio value="charmander">Charmander</Radio>
        <Radio value="squirtle">Squirtle</Radio>
      </RadioGroup>
      <RadioGroup
        label="Horizontal layout"
        orientation="horizontal"
        defaultValue="react"
      >
        <Radio value="react">React</Radio>
        <Radio value="vue">Vue</Radio>
        <Radio value="angular">Angular</Radio>
      </RadioGroup>
      <RadioGroup label="Disabled" isDisabled defaultValue="a">
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
      </RadioGroup>
    </Flex>
  </Section>
);

const SearchAutocompleteExample = () => {
  const [inputValue, setInputValue] = useState('');
  const fruits = [
    { id: 'apple', name: 'Apple', description: 'A round fruit' },
    { id: 'banana', name: 'Banana', description: 'A yellow curved fruit' },
    { id: 'cherry', name: 'Cherry', description: 'A small red stone fruit' },
    { id: 'grape', name: 'Grape', description: 'A small round fruit' },
    { id: 'orange', name: 'Orange', description: 'A citrus fruit' },
  ];
  const filtered = fruits.filter(f =>
    f.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <Section title="SearchAutocomplete">
      <SearchAutocomplete
        placeholder="Search fruits..."
        inputValue={inputValue}
        onInputChange={setInputValue}
        aria-label="Search fruits"
      >
        {filtered.map(fruit => (
          <SearchAutocompleteItem
            key={fruit.id}
            id={fruit.id}
            textValue={fruit.name}
          >
            <Flex direction="column">
              <Text weight="bold">{fruit.name}</Text>
              <Text variant="body-small" color="secondary">
                {fruit.description}
              </Text>
            </Flex>
          </SearchAutocompleteItem>
        ))}
      </SearchAutocomplete>
    </Section>
  );
};

const SearchFieldExample = () => (
  <Section title="SearchField">
    <Flex gap="4" align="end">
      <SearchField aria-label="Search" size="small" />
      <SearchField aria-label="Search" size="medium" />
      <SearchField label="With Label" description="Enter a search term" />
      <SearchField aria-label="Collapsible" size="small" startCollapsed />
      <SearchField aria-label="Disabled" isDisabled />
    </Flex>
  </Section>
);

const SelectExample = () => (
  <Section title="Select">
    <Flex gap="4">
      <Select
        name="language"
        label="Language"
        options={[
          { id: 'en', label: 'English' },
          { id: 'fr', label: 'French' },
          { id: 'de', label: 'German' },
          { id: 'es', label: 'Spanish' },
        ]}
      />
      <Select
        name="skills"
        label="Multi-select"
        selectionMode="multiple"
        options={[
          { id: 'react', label: 'React' },
          { id: 'typescript', label: 'TypeScript' },
          { id: 'python', label: 'Python' },
          { id: 'go', label: 'Go' },
        ]}
      />
      <Select
        name="disabled"
        label="Disabled"
        isDisabled
        options={[{ id: 'a', label: 'Option A' }]}
      />
      <Select
        name="grouped"
        label="With Sections"
        options={[
          {
            title: 'Frontend',
            options: [
              { id: 'react', label: 'React' },
              { id: 'vue', label: 'Vue' },
            ],
          },
          {
            title: 'Backend',
            options: [
              { id: 'node', label: 'Node.js' },
              { id: 'python', label: 'Python' },
            ],
          },
        ]}
      />
    </Flex>
  </Section>
);

const SkeletonExample = () => (
  <Section title="Skeleton">
    <Box bg="neutral" p="4">
      <Flex gap="4" align="center">
        <Skeleton rounded width={48} height={48} />
        <Flex direction="column" gap="2">
          <Skeleton width={200} height={8} />
          <Skeleton width={160} height={8} />
          <Skeleton width={120} height={8} />
        </Flex>
      </Flex>
    </Box>
  </Section>
);

const SliderExample = () => (
  <Section title="Slider">
    <Flex direction="column" gap="4">
      <Slider label="Volume" defaultValue={50} />
      <Slider
        label="Price Range"
        minValue={0}
        maxValue={1000}
        defaultValue={[200, 800]}
        formatOptions={{ style: 'currency', currency: 'USD' }}
      />
      <Slider
        label="Temperature (°C)"
        minValue={-10}
        maxValue={40}
        step={5}
        defaultValue={20}
      />
      <Slider label="Disabled" isDisabled defaultValue={30} />
    </Flex>
  </Section>
);

const SwitchExample = () => (
  <Section title="Switch">
    <Flex gap="4" align="center">
      <Switch label="Default" />
      <Switch label="Selected" defaultSelected />
      <Switch label="Disabled" isDisabled />
      <Switch label="Disabled Selected" isDisabled isSelected />
      <Switch label="Read Only" isSelected isReadOnly />
    </Flex>
  </Section>
);

const TabsExample = () => (
  <Section title="Tabs">
    <Flex direction="column" gap="6">
      <Tabs defaultSelectedKey="overview">
        <TabList>
          <Tab id="overview">Overview</Tab>
          <Tab id="details">Details</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="disabled" isDisabled>
            Disabled
          </Tab>
        </TabList>
        <TabPanel id="overview">
          <Text>Overview content goes here.</Text>
        </TabPanel>
        <TabPanel id="details">
          <Text>Details content goes here.</Text>
        </TabPanel>
        <TabPanel id="activity">
          <Text>Activity content goes here.</Text>
        </TabPanel>
        <TabPanel id="disabled">
          <Text>Disabled content.</Text>
        </TabPanel>
      </Tabs>
    </Flex>
  </Section>
);

const TagGroupExample = () => (
  <Section title="TagGroup">
    <Flex direction="column" gap="4">
      <TagGroup>
        <Tag>Banana</Tag>
        <Tag>Apple</Tag>
        <Tag>Orange</Tag>
      </TagGroup>
      <TagGroup>
        <Tag href="#" size="small">
          Small Link
        </Tag>
        <Tag href="#" size="medium">
          Medium Link
        </Tag>
      </TagGroup>
      <TagGroup>
        <Tag icon={<BugReportIcon fontSize="small" />}>Bug</Tag>
        <Tag icon={<AccountCircleIcon fontSize="small" />}>User</Tag>
        <Tag icon={<VisibilityIcon fontSize="small" />}>Visible</Tag>
        <Tag icon={<FavoriteIcon fontSize="small" />}>Favorite</Tag>
      </TagGroup>
      <TagGroup>
        <Tag isDisabled>Disabled</Tag>
        <Tag isDisabled>Also Disabled</Tag>
      </TagGroup>
    </Flex>
  </Section>
);

const TextExample = () => (
  <Section title="Text">
    <Flex direction="column" gap="2">
      <Text variant="title-large">Title Large</Text>
      <Text variant="title-medium">Title Medium</Text>
      <Text variant="title-small">Title Small</Text>
      <Text variant="title-x-small">Title X-Small</Text>
      <Text variant="body-large">Body Large</Text>
      <Text variant="body-medium">Body Medium (default)</Text>
      <Text variant="body-small">Body Small</Text>
      <Text variant="body-x-small">Body X-Small</Text>
      <Flex gap="4">
        <Text color="primary">Primary</Text>
        <Text color="secondary">Secondary</Text>
        <Text color="danger">Danger</Text>
        <Text color="warning">Warning</Text>
        <Text color="success">Success</Text>
      </Flex>
      <Flex gap="4">
        <Text weight="regular">Regular</Text>
        <Text weight="bold">Bold</Text>
      </Flex>
    </Flex>
  </Section>
);

const TextFieldExample = () => (
  <Section title="TextField">
    <Flex gap="4">
      <TextField
        label="Small"
        size="small"
        placeholder="Enter text"
        name="text-small"
      />
      <TextField
        label="Medium"
        size="medium"
        placeholder="Enter text"
        name="text-medium"
      />
      <TextField
        label="With Description"
        description="A helpful description"
        name="text-desc"
      />
      <TextField label="Disabled" name="text-disabled" isDisabled />
      <TextField
        label="Read Only"
        name="text-readonly"
        isReadOnly
        defaultValue="Read only value"
      />
    </Flex>
  </Section>
);

const ToggleButtonExample = () => {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <Section title="ToggleButton & ToggleButtonGroup">
      <Flex direction="column" gap="4">
        <Flex gap="2" align="center">
          <ToggleButton isSelected={isSelected} onChange={setIsSelected}>
            {isSelected ? 'On' : 'Off'}
          </ToggleButton>
          <ToggleButton
            isSelected={isSelected}
            onChange={setIsSelected}
            iconStart={<StarIcon fontSize="small" />}
          >
            With Icon
          </ToggleButton>
        </Flex>
        <Flex gap="4">
          <ToggleButtonGroup
            selectionMode="single"
            defaultSelectedKeys={['dogs']}
          >
            <ToggleButton id="dogs">Dogs</ToggleButton>
            <ToggleButton id="cats">Cats</ToggleButton>
            <ToggleButton id="birds">Birds</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            selectionMode="multiple"
            defaultSelectedKeys={['frontend']}
          >
            <ToggleButton id="frontend">Frontend</ToggleButton>
            <ToggleButton id="backend">Backend</ToggleButton>
            <ToggleButton id="platform">Platform</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup selectionMode="single" isDisabled>
            <ToggleButton id="a">Disabled A</ToggleButton>
            <ToggleButton id="b">Disabled B</ToggleButton>
          </ToggleButtonGroup>
        </Flex>
      </Flex>
    </Section>
  );
};

const TooltipExample = () => (
  <Section title="Tooltip">
    <Flex gap="4">
      <TooltipTrigger>
        <Button variant="secondary">Top (default)</Button>
        <Tooltip placement="top">Top tooltip</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="secondary">Right</Button>
        <Tooltip placement="right">Right tooltip</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="secondary">Bottom</Button>
        <Tooltip placement="bottom">Bottom tooltip</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="secondary">Left</Button>
        <Tooltip placement="left">Left tooltip</Tooltip>
      </TooltipTrigger>
    </Flex>
  </Section>
);

const VisuallyHiddenExample = () => (
  <Section title="VisuallyHidden">
    <Flex direction="column" gap="2">
      <Text>
        The heading below is visually hidden but accessible to screen readers:
      </Text>
      <VisuallyHidden>
        <Text as="h2">Hidden Section Heading</Text>
      </VisuallyHidden>
      <Text color="secondary">
        (Inspect the DOM or use a screen reader to find the hidden heading
        above)
      </Text>
    </Flex>
  </Section>
);

export const OtherExample = () => {
  return (
    <Flex direction="column" gap="8" py="4">
      <AccordionExample />
      <AlertExample />
      <AvatarExample />
      <BadgeExample />
      <BoxExample />
      <ButtonIconExample />
      <ButtonLinkExample />
      <CardExample />
      <CheckboxGroupExample />
      <ComboboxExample />
      <DatePickerExample />
      <DialogExample />
      <GridExample />
      <LinkExample />
      <ListExample />
      <MenuExample />
      <NumberFieldExample />
      <PasswordFieldExample />
      <PopoverExample />
      <RadioGroupExample />
      <SearchAutocompleteExample />
      <SearchFieldExample />
      <SelectExample />
      <SkeletonExample />
      <SliderExample />
      <SwitchExample />
      <TabsExample />
      <TagGroupExample />
      <TextExample />
      <TextFieldExample />
      <ToggleButtonExample />
      <TooltipExample />
      <VisuallyHiddenExample />
    </Flex>
  );
};
