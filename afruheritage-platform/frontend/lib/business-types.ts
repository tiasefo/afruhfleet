export const BUSINESS_TYPES = [
  {
    value: 'freight_forwarder',
    label: 'Freight Forwarder',
    description: 'Clears cargo, manages shipments, coordinates import/export operations.',
  },
  {
    value: 'freight_owner',
    label: 'Freight Owner / Fleet Owner',
    description: 'Owns trucks, vans, delivery vehicles, drivers, and fleet operations.',
  },
  {
    value: 'shipper',
    label: 'Shipper / Cargo Owner',
    description: 'Moves goods and needs shipment visibility, customs, and logistics support.',
  },
  {
    value: 'customs_broker',
    label: 'Customs Broker',
    description: 'Provides customs clearance, documentation, and duty processing services.',
  },
  {
    value: 'warehouse_operator',
    label: 'Warehouse Operator',
    description: 'Manages storage, fulfillment, dispatch, and inventory workflows.',
  },
  {
    value: 'delivery_partner',
    label: 'Delivery Partner',
    description: 'Provides last-mile or regional delivery services.',
  },
]

export const DEFAULT_BUSINESS_TYPE = 'freight_forwarder'
