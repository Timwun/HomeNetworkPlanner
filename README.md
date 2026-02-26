# Home Network Planner

⚠️🚨 **CAUTION** 🚨⚠️  
**This project is vibe-coded.** 

A TypeScript-based web application for managing and visualizing your home network devices. Keep track of IP addresses, device types, network connections, and view your network topology in an interactive diagram.

## Features

- **IP Address Management**: Assign and track IP addresses with automatic validation (192.168.178.x subnet)
- **IP Conflict Detection**: Automatically detects and warns about duplicate IP addresses
- **Device Categorization**: Group devices by type (Router, Switch, Access Point, Computer, Entertainment, Mobile, IoT, Vehicle, Other)
- **Network Topology Visualization**: Interactive diagram showing how devices are connected
- **Port Configuration**: Define and manage network ports for routers, switches, and access points
- **Connection Mapping**: Track how devices connect (via specific router/switch/access point ports, WiFi, or Ethernet)
- **Search & Filter**: Quickly find devices by name, IP, or filter by device type
- **Import/Export**: Save and load network configurations as JSON files
- **Dark Mode**: Built-in dark mode support
- **Data Persistence**: Automatically saves to browser localStorage
- **Clean Start**: Begins with an empty network, ready for you to add your devices

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Network Visualization**: React Flow
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Storage**: Browser localStorage + JSON import/export

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:Timwun/HomeNetworkPlanner.git
   cd HomeNetworkPlanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be served by any static file server.

## Usage

### Adding a Device

1. Click the "Add Device" button
2. Fill in the device details:
   - **Name**: Device name (e.g., "MacBook Pro")
   - **IP Address**: Must be in 192.168.178.x format (auto-suggested)
   - **Type**: Select device category
   - **Connection**: Choose parent device and port (optional)
   - **Notes**: Additional information (optional)
3. For network devices (routers/switches), add ports in the "Network Ports" section
4. Click "Add Device" to save

### Editing a Device

1. In the table view, click the edit icon (pencil) next to any device
2. Modify the details
3. Click "Update Device" to save changes

### Network Diagram

1. Switch to "Network Diagram" view
2. Drag devices to rearrange the layout
3. Animated lines = WiFi connections
4. Solid lines = Ethernet connections
5. Lines are labeled with port names

### Managing Configuration

**Export Configuration:**
- Click "Export Config" to download your network configuration as a JSON file
- Use this to create backups

**Import Configuration:**
- Click "Import Config" and select a previously exported JSON file
- This will replace your current configuration

**Reset to Default:**
- Click "Reset to Default" to clear all devices and start fresh
- Warning: This will delete all your current devices

## Project Structure

```
src/
├── components/         # React components
│   ├── DeviceTable.tsx       # Device list with search and filtering
│   ├── DeviceForm.tsx        # Add/edit device modal
│   ├── NetworkDiagram.tsx    # Interactive network topology
│   └── ImportExport.tsx      # Configuration management
├── context/
│   └── NetworkContext.tsx    # Global state management
├── hooks/
│   └── useLocalStorage.ts    # localStorage persistence
├── types/
│   └── network.ts            # TypeScript interfaces
├── utils/
│   ├── validators.ts         # IP validation logic
│   └── initialData.ts        # Example data
├── App.tsx                    # Main application component
└── main.tsx                   # Application entry point
```

## IP Address Validation

- IP addresses must follow the format `192.168.178.x` where x is between 1-254
- The application automatically suggests the next available IP when adding a device
- Duplicate IPs are detected and highlighted in red
- Invalid IPs show an error message and prevent saving

## Network Device Ports

When adding a Router, Switch, or Access Point:
1. Add ports in the "Network Ports" section
2. Specify port name (e.g., "LAN 1", "WiFi 2.4GHz", "WiFi 5GHz")
3. Select port type (Ethernet, WiFi, or Other)
4. Other devices can then connect to these ports

## Data Storage

- All data is stored in browser localStorage under the key `network-planner-config`
- Data persists between sessions
- Use Export/Import for backup and transfer between browsers
- No backend server required - everything runs in the browser

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires JavaScript enabled
- localStorage must be available

## License

This project is open source and available for personal use.

## Troubleshooting

**Data not saving?**
- Check if localStorage is enabled in your browser
- Check browser console for errors
- Try exporting your config as backup

**Import fails?**
- Ensure the JSON file is a valid network configuration export
- Check the file format matches the expected structure

**Diagram not displaying?**
- Refresh the page
- Check browser console for errors
- Ensure all devices have valid positions

## Future Enhancements

Potential features for future versions:
- Subnet calculator
- Network scanning integration
- Device uptime monitoring
- MAC address tracking
- VLAN support
- Cable type specification
- Print/PDF export of network diagram
- Multiple network profiles
