# digital_garden/management/commands/populate_plants.py

from django.core.management.base import BaseCommand
from django.db import transaction
from digital_garden.models import Plant


class Command(BaseCommand):
    help = 'Populate the database with South African native plants and common vegetables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing plants before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing plants...')
            Plant.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing plants cleared'))

        plants_data = [
            # Common Plants (Regular order rewards)
            {
                'name': 'Lettuce',
                'scientific_name': 'Lactuca sativa',
                'category': 'vegetable',
                'rarity': 'common',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'moderate',
                'description': 'Fresh, crisp lettuce perfect for salads and sandwiches.',
                'fun_facts': 'Lettuce was first cultivated by the ancient Egyptians over 4,500 years ago!',
                'growing_tips': 'Plant in cool weather, keep soil moist, and harvest outer leaves first.',
                'rive_asset_name': 'lettuce_plant',
                'icon_color': '#4CAF50'
            },
            {
                'name': 'Spinach',
                'scientific_name': 'Spinacia oleracea',
                'category': 'vegetable',
                'rarity': 'common',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'moderate',
                'description': 'Nutrient-packed leafy green vegetable.',
                'fun_facts': 'Spinach contains more iron than most other green vegetables.',
                'growing_tips': 'Grows best in cooler temperatures. Plant successively for continuous harvest.',
                'rive_asset_name': 'spinach_plant',
                'icon_color': '#388E3C'
            },
            {
                'name': 'Wild Garlic',
                'scientific_name': 'Tulbaghia violacea',
                'category': 'herb',
                'rarity': 'common',
                'native_region': 'South Africa',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Indigenous South African herb with purple flowers.',
                'fun_facts': 'Also known as Society Garlic, it naturally repels pests!',
                'growing_tips': 'Very drought tolerant. Plant in well-draining soil.',
                'rive_asset_name': 'wild_garlic',
                'icon_color': '#9C27B0'
            },
            {
                'name': 'Carrots',
                'scientific_name': 'Daucus carota',
                'category': 'vegetable',
                'rarity': 'common',
                'care_difficulty': 'moderate',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'moderate',
                'description': 'Sweet, crunchy root vegetables rich in beta-carotene.',
                'fun_facts': 'Carrots were originally purple! Orange carrots were developed in the Netherlands.',
                'growing_tips': 'Need deep, loose soil. Thin seedlings to prevent crowding.',
                'rive_asset_name': 'carrot_plant',
                'icon_color': '#FF9800'
            },
            {
                'name': 'Mint',
                'scientific_name': 'Mentha',
                'category': 'herb',
                'rarity': 'common',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'high',
                'description': 'Aromatic herb perfect for teas, cocktails, and cooking.',
                'fun_facts': 'Mint can spread aggressively - plant in containers to control growth!',
                'growing_tips': 'Loves moist soil and partial shade. Pinch flowers to maintain leaf flavor.',
                'rive_asset_name': 'mint_plant',
                'icon_color': '#4CAF50'
            },

            # Uncommon Plants (3rd order, low amount milestones)
            {
                'name': 'Cape Honeysuckle',
                'scientific_name': 'Tecoma capensis',
                'category': 'flowering',
                'rarity': 'uncommon',
                'native_region': 'South Africa',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Vibrant orange flowering shrub native to South Africa.',
                'fun_facts': 'Attracts sunbirds and butterflies! Flowers almost year-round.',
                'growing_tips': 'Very drought tolerant once established. Prune after flowering.',
                'rive_asset_name': 'cape_honeysuckle',
                'icon_color': '#FF5722'
            },
            {
                'name': 'Rosemary',
                'scientific_name': 'Rosmarinus officinalis',
                'category': 'herb',
                'rarity': 'uncommon',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Fragrant Mediterranean herb excellent for cooking.',
                'fun_facts': 'Rosemary can live for decades and was traditionally used to improve memory.',
                'growing_tips': 'Plant in well-draining soil. Very drought tolerant.',
                'rive_asset_name': 'rosemary_plant',
                'icon_color': '#2E7D32'
            },
            {
                'name': 'Sweet Basil',
                'scientific_name': 'Ocimum basilicum',
                'category': 'herb',
                'rarity': 'uncommon',
                'care_difficulty': 'moderate',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'moderate',
                'description': 'Essential culinary herb with sweet, aromatic leaves.',
                'fun_facts': 'There are over 60 varieties of basil worldwide!',
                'growing_tips': 'Pinch flower buds to keep leaves tender. Protect from frost.',
                'rive_asset_name': 'basil_plant',
                'icon_color': '#4CAF50'
            },

            # Rare Plants (5th, 10th order, R300 milestones, 5 businesses)
            {
                'name': 'Bird of Paradise',
                'scientific_name': 'Strelitzia reginae',
                'category': 'flowering',
                'rarity': 'rare',
                'native_region': 'South Africa',
                'care_difficulty': 'moderate',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'moderate',
                'description': 'Iconic South African flower resembling a bird in flight.',
                'fun_facts': 'South Africa\'s national flower! Takes 4-5 years to bloom from seed.',
                'growing_tips': 'Needs warm temperatures and bright light. Water regularly in summer.',
                'rive_asset_name': 'bird_of_paradise',
                'icon_color': '#FF9800'
            },
            {
                'name': 'Jade Plant',
                'scientific_name': 'Crassula ovata',
                'category': 'succulent',
                'rarity': 'rare',
                'native_region': 'South Africa',
                'care_difficulty': 'easy',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'low',
                'description': 'Lucky succulent with thick, glossy leaves.',
                'fun_facts': 'Symbol of good luck and prosperity! Can live for 100+ years.',
                'growing_tips': 'Water sparingly. Let soil dry between waterings.',
                'rive_asset_name': 'jade_plant',
                'icon_color': '#4CAF50'
            },
            {
                'name': 'African Potato',
                'scientific_name': 'Hypoxis hemerocallidea',
                'category': 'herb',
                'rarity': 'rare',
                'native_region': 'South Africa',
                'care_difficulty': 'moderate',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'moderate',
                'description': 'Indigenous medicinal plant with yellow star-shaped flowers.',
                'fun_facts': 'Used in traditional medicine for centuries. Not actually a potato!',
                'growing_tips': 'Plant in well-draining soil. Goes dormant in winter.',
                'rive_asset_name': 'african_potato',
                'icon_color': '#FFC107'
            },

            # Epic Plants (15th, 20th order, R500 milestones, 10+ businesses)
            {
                'name': 'King Protea',
                'scientific_name': 'Protea cynaroides',
                'category': 'flowering',
                'rarity': 'epic',
                'native_region': 'South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Majestic South African national flower with crown-like blooms.',
                'fun_facts': 'Can survive bush fires! The flower head can be 30cm across.',
                'growing_tips': 'Needs acidic, well-draining soil. Never fertilize with phosphorus.',
                'rive_asset_name': 'king_protea',
                'icon_color': '#E91E63'
            },
            {
                'name': 'Baobab Tree',
                'scientific_name': 'Adansonia digitata',
                'category': 'tree',
                'rarity': 'epic',
                'native_region': 'South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Ancient African tree that can live for thousands of years.',
                'fun_facts': 'Known as the "Tree of Life" - stores up to 120,000 liters of water!',
                'growing_tips': 'Extremely slow growing. Needs hot, dry conditions.',
                'rive_asset_name': 'baobab_tree',
                'icon_color': '#8D6E63'
            },
            {
                'name': 'Cycad',
                'scientific_name': 'Encephalartos altensteinii',
                'category': 'tree',
                'rarity': 'epic',
                'native_region': 'South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'partial_sun',
                'water_requirements': 'low',
                'description': 'Living fossil that survived with the dinosaurs.',
                'fun_facts': 'Some cycads are over 1,000 years old! They\'re more related to pine trees than palms.',
                'growing_tips': 'Very slow growing. Needs excellent drainage.',
                'rive_asset_name': 'cycad_plant',
                'icon_color': '#2E7D32'
            },

            # Legendary Plants (25th+ orders, R1000+ milestones, 20+ businesses)
            {
                'name': 'Welwitschia',
                'scientific_name': 'Welwitschia mirabilis',
                'category': 'tree',
                'rarity': 'legendary',
                'native_region': 'Namibia/South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Desert survivor that can live over 1,500 years with just two leaves.',
                'fun_facts': 'Called "living fossil" - only has 2 leaves that grow continuously for centuries!',
                'growing_tips': 'Requires desert conditions. Extremely difficult to cultivate.',
                'rive_asset_name': 'welwitschia',
                'icon_color': '#795548'
            },
            {
                'name': 'Silver Tree',
                'scientific_name': 'Leucadendron argenteum',
                'category': 'tree',
                'rarity': 'legendary',
                'native_region': 'South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'full_sun',
                'water_requirements': 'low',
                'description': 'Endangered silver-leafed tree endemic to Table Mountain.',
                'fun_facts': 'Found only on Table Mountain! Critically endangered with less than 1,000 trees left.',
                'growing_tips': 'Needs Mediterranean climate and perfect drainage. Very sensitive to root disturbance.',
                'rive_asset_name': 'silver_tree',
                'icon_color': '#9E9E9E'
            },
            {
                'name': 'Ghost Orchid',
                'scientific_name': 'Dendrobium aphyllum',
                'category': 'flowering',
                'rarity': 'legendary',
                'native_region': 'South Africa',
                'care_difficulty': 'difficult',
                'sunlight_requirements': 'shade',
                'water_requirements': 'high',
                'description': 'Ethereal orchid that appears to float like a ghost.',
                'fun_facts': 'Blooms without leaves, appearing ghostly! Can remain dormant for years.',
                'growing_tips': 'Epiphytic - grows on other plants. Needs high humidity.',
                'rive_asset_name': 'ghost_orchid',
                'icon_color': '#E1BEE7'
            }
        ]

        self.stdout.write('Creating plants...')
        
        with transaction.atomic():
            created_count = 0
            for plant_data in plants_data:
                plant, created = Plant.objects.get_or_create(
                    name=plant_data['name'],
                    defaults=plant_data
                )
                if created:
                    created_count += 1
                    self.stdout.write(f'  Created: {plant.name} ({plant.rarity})')
                else:
                    self.stdout.write(f'  Exists: {plant.name} ({plant.rarity})')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated {created_count} new plants. '
                f'Total plants in database: {Plant.objects.count()}'
            )
        )

        # Display summary by rarity
        self.stdout.write('\nPlant distribution by rarity:')
        for rarity, _ in Plant.RARITY_CHOICES:
            count = Plant.objects.filter(rarity=rarity, is_active=True).count()
            self.stdout.write(f'  {rarity.title()}: {count} plants')

        self.stdout.write(
            self.style.SUCCESS('\nPlant population completed successfully!')
        )