import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1726600000001 implements MigrationInterface {
  name = 'SeedData1726600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert categories
    await queryRunner.query(`
      INSERT INTO categories (id, name, icon) VALUES
      ('all', 'All', '🌾'),
      ('agriculture-equipments', 'Agricultural Equipments', '🚜'),
      ('seeds', 'Seeds', '🌱'),
      ('fertilizers', 'Fertilizers', '🌿'),
      ('irrigation', 'Irrigation', '💧'),
      ('pumps-motors', 'Pumps & Motors', '⚙️'),
      ('tools', 'Tools', '🛠️'),
      ('cement', 'Cement', '🏗️'),
      ('tiling', 'Tiling', '🧱'),
      ('painting', 'Painting', '🎨'),
      ('waterproofing', 'Waterproofing', '🛡️'),
      ('plywood', 'Plywood, MDF & HDHMR', '🪵'),
      ('adhesive', 'Adhesive', '📎'),
      ('hinges', 'Hinges, Channels & Handles', '🔩'),
      ('kitchen-systems', 'Kitchen Systems & Accessories', '🧰'),
      ('wardrobe-fittings', 'Wardrobe & Bed Fittings', '🛏️'),
      ('door-locks', 'Door Locks & Hardware', '🔒'),
      ('electrical-conduits', 'Electrical Conduits', '🧰'),
      ('wires', 'Wires, MCB & Distribution', '⚡'),
      ('switches', 'Switches & Sockets', '🔌'),
      ('lighting', 'Lighting', '💡'),
      ('cpvc', 'CPVC Pipes & Fittings', '🚿'),
      ('apvc', 'APVC Pipes & Fittings', '🚰'),
      ('pvc', 'PVC Pipes & Fittings', '🧯'),
      ('overhead-tanks', 'Overhead Tanks', '💧'),
      ('sanitary', 'Sanitary & Bath Fittings', '🛁'),
      ('electrical', 'Electrical', '💡'),
      ('furniture', 'Furniture', '🪑'),
      ('plumbing', 'Plumbing', '🚿')
      ON CONFLICT (id) DO NOTHING
    `);

    // Insert products
    await queryRunner.query(`
      INSERT INTO products (id, category_id, name, unit, price, rating, emoji, color, description) VALUES
      ('tomato-seeds', 'seeds', 'Premium Tomato Seeds', 'Packet of 50 seeds', 149, 4.8, '🍅', '#FFE5DD', 'High-yield hybrid tomato seeds suitable for home gardens and farms.'),
      ('organic-fertilizer', 'fertilizers', 'Organic Compost', '5 kg bag', 399, 4.7, '💧', '#283068', 'Nutrient-rich organic compost that supports healthy soil and roots.'),
      ('garden-trowel', 'tools', 'Steel Garden Trowel', '1 piece', 249, 4.6, '🛠️', '#E0F0FF', 'A durable hand trowel for planting, transplanting, and weeding.'),
      ('drip-kit', 'irrigation', 'Drip Irrigation Kit', '10 metre kit', 899, 4.9, '💧', '#DCF4F4', 'Water-saving drip kit for small gardens and vegetable beds.'),
      ('submersible-pump', 'pumps-motors', 'Submersible Pump', '1 unit', 4999, 4.8, '⚙️', '#E9F9EE', 'High-efficiency submersible pump for borewell and water-lifting applications.'),
      ('farm-motor', 'pumps-motors', 'Agricultural Motor', '1 motor', 6890, 4.7, '🔧', '#F4E7D8', 'Reliable performance motor for irrigation pumps and agricultural equipment.'),
      ('chilli-seeds', 'seeds', 'Green Chilli Seeds', 'Packet of 100 seeds', 119, 4.5, '🌶️', '#FDE7E7', 'Fresh green chilli seeds with reliable germination.'),
      ('neem-cake', 'fertilizers', 'Neem Cake Fertilizer', '1 kg pack', 179, 4.7, '🌿', '#E7F4E3', 'Natural soil conditioner that helps nourish plants over time.'),
      ('ultratech-cement', 'cement', 'UltraTech Cement', '50 kg bag', 355, 4.8, '🏗️', '#F4E7D8', 'High-strength cement for structural work and masonry projects.'),
      ('white-cement', 'cement', 'White Cement', '25 kg bag', 260, 4.7, '🧱', '#F8F4F1', 'Premium white cement ideal for finishing walls and decorative surfaces.'),
      ('ceramic-tiles', 'tiling', 'Ceramic Floor Tiles', 'Box of 10 tiles', 980, 4.6, '🧩', '#DDEEFF', 'Durable and easy-to-clean ceramic tiles for living spaces and kitchens.'),
      ('wall-tiles', 'tiling', 'Gloss Wall Tiles', 'Box of 8 tiles', 760, 4.5, '🧱', '#E9F3FF', 'Water-resistant wall tiles for bathrooms and feature walls.'),
      ('exterior-paint', 'painting', 'Weather Shield Paint', '20 litre bucket', 2499, 4.7, '🎨', '#FDE9D1', 'Long-lasting exterior paint with good weather resistance and finish.'),
      ('interior-emulsion', 'painting', 'Premium Interior Emulsion', '10 litre bucket', 1349, 4.8, '🖌️', '#F3E7FF', 'Smooth interior wall paint for a clean and modern home finish.'),
      ('roof-sealer', 'waterproofing', 'Roof Waterproofing Sealant', '20 kg pack', 1899, 4.7, '🛡️', '#EAF7F2', 'Flexible waterproofing compound that protects terraces and concrete roofs.'),
      ('crack-guard', 'waterproofing', 'Crack Guard Coating', '10 litre drum', 1499, 4.6, '💧', '#DFF3FF', 'Protective coating for walls and slabs against seepage and dampness.'),
      ('marine-plywood', 'plywood', 'Marine Plywood', '8 x 4 ft sheet', 2850, 4.8, '🪵', '#E9D9C8', 'Moisture-resistant plywood for kitchens, cabinets, and durable furniture.'),
      ('mdf-board', 'plywood', 'MDF Board', '8 x 4 ft sheet', 2190, 4.6, '📦', '#F3E7D3', 'Smooth engineered wood panel suitable for modular furniture and partitions.'),
      ('construction-adhesive', 'adhesive', 'Construction Adhesive', '1 tube', 349, 4.7, '📎', '#FDE7D8', 'Heavy-duty adhesive for bonding tiles, stone, and wood trim.'),
      ('silicone-sealant', 'adhesive', 'Silicone Sealant', '300 ml tube', 295, 4.8, '🩹', '#E3F3FF', 'Flexible sealant for sanitary joints and leakage-prone edges.'),
      ('led-bulb', 'electrical', 'LED Bulb Pack', '4 bulbs', 540, 4.7, '💡', '#FFF1C4', 'Energy-efficient LED lighting for homes, shops, and farmhouses.'),
      ('switch-board', 'electrical', 'Modular Switch Board', '1 set', 690, 4.5, '🔌', '#E7F0FF', 'Modern electrical switch set with safe and neat installation.'),
      ('aluminium-door', 'furniture', 'Aluminium Door Handle Set', '1 set', 890, 4.6, '🪑', '#E2F4EC', 'Stylish hardware for doors, windows, and architectural finishing.'),
      ('cabinet-hardware', 'furniture', 'Cabinet Pull Handles', 'Pack of 10', 450, 4.5, '🪵', '#F4E8DB', 'Strong and attractive handles for wardrobes and kitchen cabinets.'),
      ('pvc-pipe', 'plumbing', 'PVC Water Pipe', '1 piece', 210, 4.7, '🚿', '#DFF5F0', 'Leak-resistant piping for domestic water supply and drainage lines.'),
      ('pipe-fittings', 'plumbing', 'Pipe Fittings Kit', 'Set of 8', 460, 4.6, '🔧', '#E6F2FF', 'Complete plumbing fitting set for repairs and small installations.'),
      ('bath-faucet', 'sanitary', 'Premium Bath Faucet', '1 piece', 1490, 4.8, '🚰', '#E8F4FF', 'Modern sanitary fixture designed for durable everyday use.'),
      ('wash-basin', 'sanitary', 'Wall Mount Wash Basin', '1 unit', 2490, 4.6, '🛁', '#F2F6FF', 'Compact and elegant basin for homes, hostels, and commercial projects.'),
      ('tractor-implement', 'agriculture-equipments', 'Compact Tractor Implement', '1 unit', 31800, 4.9, '🚜', '#E6F5DF', 'Multi-use agricultural implement for tilling, lifting, and field support.'),
      ('sprayer-machine', 'agriculture-equipments', 'Power Sprayer', '1 machine', 6850, 4.8, '🌾', '#EAF8DD', 'Efficient power sprayer for crop protection and farm maintenance.'),
      ('hinge-set', 'hinges', 'Heavy Duty Hinge Set', '1 set', 980, 4.6, '🔩', '#E7EEF7', 'Durable hinge and channel hardware for doors, cabinets, and furniture assembly.'),
      ('soft-close-kitchen', 'kitchen-systems', 'Soft Close Kitchen System', '1 kit', 2490, 4.7, '🧰', '#E7F7EE', 'Modern kitchen accessories and fittings for efficient cabinet organization.'),
      ('wardrobe-track', 'wardrobe-fittings', 'Wardrobe Sliding Track', '1 unit', 1430, 4.5, '🛏️', '#F8E6D7', 'Strong wardrobe and bed-fitting hardware for smooth sliding and support.'),
      ('door-lock-set', 'door-locks', 'Premium Door Lock Set', '1 set', 1690, 4.8, '🔒', '#E9F2FF', 'Secure lock and handle combination for residential and commercial doors.'),
      ('electrical-conduit', 'electrical-conduits', 'PVC Electrical Conduit', '1 bundle', 510, 4.6, '🧰', '#F2EAD7', 'Protective conduit solution for safe wiring and cleaner electrical installation.'),
      ('copper-wire', 'wires', 'Copper Wiring Pack', '10 m roll', 780, 4.7, '⚡', '#F9F0DF', 'Dependable electrical wire set for homes, shops, and light industrial use.'),
      ('modular-switch', 'switches', 'Modular Switch Set', '1 set', 640, 4.5, '🔌', '#E7F4FF', 'Stylish switch and socket combination for modern electrical layouts.'),
      ('led-panel', 'lighting', 'LED Panel Light', '1 unit', 1490, 4.8, '💡', '#FFF0CF', 'Energy-saving lighting fixture designed for offices, shops, and homes.'),
      ('cpvc-pipe', 'cpvc', 'CPVC Pipe Bundle', '4 pieces', 870, 4.7, '🚿', '#DFF3FA', 'Hot and cold water system piping built for safe domestic plumbing.'),
      ('apvc-pipe', 'apvc', 'APVC Pipe Fittings', '1 set', 640, 4.6, '🚰', '#E9F8F0', 'Reliable pressure-resistant piping range for utility and drainage applications.'),
      ('pvc-water-pipe', 'pvc', 'PVC Water Pipe', '1 piece', 410, 4.7, '🧯', '#E4F6FF', 'Flexible and easy-to-install pipe for water distribution and irrigation.'),
      ('water-tank', 'overhead-tanks', 'Overhead Water Tank', '500 litre', 7490, 4.7, '💧', '#D9F4F5', 'Storage tank for clean water supply in homes, farms, and small commercial units.'),
      ('bath-fittings', 'sanitary', 'Bathroom Fittings Kit', '1 set', 2190, 4.8, '🛁', '#EAF3FF', 'Modern sanitary fittings for taps, wash areas, and bathroom plumbing systems.')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM cart_items`);
    await queryRunner.query(`DELETE FROM products`);
    await queryRunner.query(`DELETE FROM categories`);
  }
}
