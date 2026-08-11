from django.core.management.base import BaseCommand

from products.models import Product

SAMPLE_PRODUCTS = [
    {
        'name': 'Wireless Headphones',
        'description': 'Over-ear Bluetooth headphones with active noise cancellation, '
                        '30-hour battery life, and a plush memory-foam headband for '
                        'all-day comfort.',
        'price': '79.99',
        'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'category': 'Audio',
        'stock': 45,
    },
    {
        'name': 'Smart Watch',
        'description': 'Fitness-focused smart watch with heart-rate monitoring, GPS, '
                        'sleep tracking, and a vivid always-on AMOLED display.',
        'price': '129.99',
        'image': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
        'category': 'Wearables',
        'stock': 30,
    },
    {
        'name': 'Laptop Backpack',
        'description': 'Water-resistant backpack with a padded 15.6" laptop sleeve, '
                        'USB charging port, and multiple organizer pockets.',
        'price': '49.99',
        'image': 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600',
        'category': 'Accessories',
        'stock': 60,
    },
    {
        'name': 'Mechanical Keyboard',
        'description': 'Compact 87-key mechanical keyboard with hot-swappable switches, '
                        'per-key RGB lighting, and a durable aluminum frame.',
        'price': '89.99',
        'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
        'category': 'Computer Accessories',
        'stock': 25,
    },
    {
        'name': 'Wireless Mouse',
        'description': 'Ergonomic wireless mouse with silent clicks, adjustable DPI up '
                        'to 4000, and a rechargeable battery that lasts weeks.',
        'price': '24.99',
        'image': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
        'category': 'Computer Accessories',
        'stock': 80,
    },
    {
        'name': 'Bluetooth Speaker',
        'description': 'Portable waterproof speaker with 360-degree sound, 12-hour '
                        'playtime, and a built-in mic for hands-free calls.',
        'price': '39.99',
        'image': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
        'category': 'Audio',
        'stock': 50,
    },
    {
        'name': 'USB-C Hub',
        'description': '7-in-1 USB-C hub with HDMI 4K output, SD/microSD card reader, '
                        'and 100W pass-through power delivery.',
        'price': '34.99',
        'image': 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600',
        'category': 'Computer Accessories',
        'stock': 40,
    },
    {
        'name': 'Phone Stand',
        'description': 'Adjustable aluminum phone stand compatible with all smartphones, '
                        'foldable for travel and stable on any desk.',
        'price': '14.99',
        'image': 'https://images.unsplash.com/photo-1583573636246-e56be1ea0e58?w=600',
        'category': 'Accessories',
        'stock': 100,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample MiniShop products.'

    def handle(self, *args, **options):
        created_count = 0
        for data in SAMPLE_PRODUCTS:
            _, created = Product.objects.get_or_create(name=data['name'], defaults=data)
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {created_count} new product(s). '
            f'Total products in database: {Product.objects.count()}.'
        ))
