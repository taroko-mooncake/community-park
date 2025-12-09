
import { Park, TaskStatus } from './types';

export const INITIAL_PARKS: Park[] = [
  {
    id: 'p_meridian',
    name: 'Meridian Hill Park',
    location: '16th St NW & W St NW, Washington, DC',
    description: 'A structured urban park in the nation\'s capital featuring a cascading fountain, historic statues, and a gathered community drum circle tradition.',
    tasks: [
      {
        id: 't_m1',
        title: 'Weed the Lower Plaza',
        description: 'Remove invasive weeds growing between the historic pavers on the lower plaza level.',
        status: TaskStatus.OPEN,
        volunteers: ['Sarah', 'Mike'],
        date: '2023-11-12',
        urgency: 'Medium'
      },
      {
        id: 't_m2',
        title: 'Joan of Arc Statue Cleanup',
        description: 'Clear litter and fallen branches from the base of the Joan of Arc statue.',
        status: TaskStatus.OPEN,
        volunteers: [],
        date: '2023-11-15',
        urgency: 'Low'
      }
    ],
    googleMapsUrl: 'https://www.google.com/maps/place/Meridian+Hill+Park/@38.9209516,-77.0357283,17z',
    lat: 38.9209,
    lng: -77.0357
  },
  {
    id: 'p_tompkins',
    name: 'Tompkins Square Park',
    location: 'E 10th St, New York, NY',
    description: 'A historic centerpiece of the East Village, known for its collection of American Elm trees, vibrant dog runs, and rich history of community activism.',
    tasks: [
      {
        id: 't_ts1',
        title: 'Elm Tree Bed Mulching',
        description: 'Apply fresh mulch to the tree beds along the central promenade to protect the roots for winter.',
        status: TaskStatus.OPEN,
        volunteers: ['Alex'],
        date: '2023-11-05',
        urgency: 'High'
      },
      {
        id: 't_ts2',
        title: 'Playground Safety Check',
        description: 'Inspect the swings and slides in the main playground for any loose bolts or safety hazards.',
        status: TaskStatus.COMPLETED,
        volunteers: ['Jamie', 'Taylor'],
        date: '2023-10-30',
        urgency: 'High'
      }
    ],
    googleMapsUrl: 'https://www.google.com/maps/place/Tompkins+Square+Park/@40.7264871,-73.981778,17z',
    lat: 40.7265,
    lng: -73.9818
  },
  {
    id: 'p_dolores',
    name: 'Mission Dolores Park',
    location: 'Dolores St & 19th St, San Francisco, CA',
    description: 'One of San Francisco\'s most popular parks, famous for its stunning city views, palm trees, and sunny slopes perfect for picnics.',
    tasks: [
      {
        id: 't_d1',
        title: 'Monday Morning Litter Sweep',
        description: 'Help clear weekend picnic debris from the southern slopes.',
        status: TaskStatus.OPEN,
        volunteers: [],
        date: '2023-11-13',
        urgency: 'High'
      }
    ],
    googleMapsUrl: 'https://www.google.com/maps/place/Mission+Dolores+Park/@37.7596168,-122.426901,17z',
    lat: 37.7596,
    lng: -122.4269
  }
];