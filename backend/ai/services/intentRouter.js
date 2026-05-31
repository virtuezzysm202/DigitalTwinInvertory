const INFORMATION_INTENTS = [
  'search_item',
  'check_stock',
  'low_stock',
  'room_information',
  'zone_information',
  'count_zone',
  'count_item'
];

const LAYOUT_INTENTS = [
  'move_item',
  'move_zone',
  'resize_room',
  'resize_zone',
  'update_position'
];

function getIntentCategory(intent) {
  if (INFORMATION_INTENTS.includes(intent)) {
    return 'information';
  }

  if (LAYOUT_INTENTS.includes(intent)) {
    return 'layout';
  }

  return 'unknown';
}

function routeIntent(intent) {
  const category = getIntentCategory(intent);

  switch (category) {
    case 'information':
      return 'aiAssistantService';

    case 'layout':
      return 'aiLayoutService';

    default:
      return null;
  }
}

module.exports = {
  routeIntent,
  getIntentCategory,
  INFORMATION_INTENTS,
  LAYOUT_INTENTS
};