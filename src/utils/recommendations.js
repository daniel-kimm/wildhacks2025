import { supabase } from './supabaseClient';

/**
 * Get personalized hangout spot recommendations based on user interests
 * @param {string} interests - Comma-separated list of user interests
 * @returns {Promise<Array>} Array of recommendation objects
 */
export const getPersonalizedRecommendations = async (interests) => {
  try {
    // Parse interests into an array
    const interestList = interests.toLowerCase().split(',').map(i => i.trim());
    
    // Define recommendation categories based on interests
    const recommendationsByCategory = {
      'reading': [
        { 
          name: 'Local Library', 
          category: 'Library', 
          description: 'A quiet space perfect for book lovers with reading rooms and a café.',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=60',
          rating: 4.7,
          distance: '1.2 miles'
        },
        { 
          name: 'Book Club Café', 
          category: 'Café', 
          description: 'Cozy café with book-themed décor and reading nooks.',
          image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=60',
          rating: 4.5,
          distance: '0.8 miles'
        }
      ],
      'gaming': [
        { 
          name: 'Game Center', 
          category: 'Entertainment', 
          description: 'Modern gaming center with latest consoles and board games.',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a741?w=800&auto=format&fit=crop&q=60',
          rating: 4.6,
          distance: '1.5 miles'
        },
        { 
          name: 'Arcade Café', 
          category: 'Entertainment', 
          description: 'Retro arcade games and snacks in a fun atmosphere.',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60',
          rating: 4.4,
          distance: '2.1 miles'
        }
      ],
      'sports': [
        { 
          name: 'Community Sports Center', 
          category: 'Sports', 
          description: 'Multi-sport facility with courts and equipment.',
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
          rating: 4.8,
          distance: '1.7 miles'
        },
        { 
          name: 'Sports Bar & Grill', 
          category: 'Restaurant', 
          description: 'Watch games while enjoying great food and atmosphere.',
          image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=60',
          rating: 4.3,
          distance: '0.9 miles'
        }
      ],
      'art': [
        { 
          name: 'Art Gallery', 
          category: 'Culture', 
          description: 'Local gallery featuring rotating exhibitions.',
          image: 'https://images.unsplash.com/photo-1577083552431-6e5c0198d8b3?w=800&auto=format&fit=crop&q=60',
          rating: 4.9,
          distance: '1.3 miles'
        },
        { 
          name: 'Art Studio Café', 
          category: 'Café', 
          description: 'Creative space with art supplies and coffee.',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60',
          rating: 4.7,
          distance: '0.5 miles'
        }
      ],
      'music': [
        { 
          name: 'Music Venue', 
          category: 'Entertainment', 
          description: 'Live music venue with regular performances.',
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
          rating: 4.6,
          distance: '1.8 miles'
        },
        { 
          name: 'Vinyl Café', 
          category: 'Café', 
          description: 'Coffee shop with extensive vinyl collection and listening stations.',
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
          rating: 4.5,
          distance: '1.1 miles'
        }
      ],
      'food': [
        { 
          name: 'Foodie Market', 
          category: 'Shopping', 
          description: 'Local food market with fresh ingredients and cooking classes.',
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60',
          rating: 4.7,
          distance: '1.4 miles'
        },
        { 
          name: 'Cooking Studio', 
          category: 'Entertainment', 
          description: 'Take cooking classes and learn new recipes.',
          image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=60',
          rating: 4.8,
          distance: '2.2 miles'
        }
      ],
      'outdoors': [
        { 
          name: 'Riverside Trail', 
          category: 'Outdoors', 
          description: 'Scenic walking trail along the river with picnic spots.',
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
          rating: 4.6,
          distance: '1.5 miles'
        },
        { 
          name: 'Community Garden', 
          category: 'Outdoors', 
          description: 'Beautiful garden space with walking paths and benches.',
          image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=60',
          rating: 4.5,
          distance: '0.7 miles'
        }
      ],
      'technology': [
        { 
          name: 'Tech Hub', 
          category: 'Entertainment', 
          description: 'Space for tech enthusiasts with VR experiences and workshops.',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
          rating: 4.7,
          distance: '1.9 miles'
        },
        { 
          name: 'Coding Café', 
          category: 'Café', 
          description: 'Café with coding workshops and tech meetups.',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
          rating: 4.4,
          distance: '1.2 miles'
        }
      ],
      'movies': [
        { 
          name: 'Indie Cinema', 
          category: 'Entertainment', 
          description: 'Independent film theater with unique screenings.',
          image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop&q=60',
          rating: 4.8,
          distance: '2.0 miles'
        },
        { 
          name: 'Film Discussion Club', 
          category: 'Entertainment', 
          description: 'Regular meetups to discuss films and watch classics.',
          image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=60',
          rating: 4.5,
          distance: '1.6 miles'
        }
      ],
      'fitness': [
        { 
          name: 'Yoga Studio', 
          category: 'Fitness', 
          description: 'Peaceful yoga studio with various class options.',
          image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60',
          rating: 4.9,
          distance: '0.9 miles'
        },
        { 
          name: 'Fitness Park', 
          category: 'Outdoors', 
          description: 'Outdoor fitness equipment and workout spaces.',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60',
          rating: 4.6,
          distance: '1.3 miles'
        }
      ]
    };
    
    // Generate personalized recommendations based on interests
    let personalized = [];
    
    // Add recommendations for each interest
    interestList.forEach(interest => {
      // Find matching category
      const matchingCategory = Object.keys(recommendationsByCategory).find(category => 
        interest.includes(category) || category.includes(interest)
      );
      
      if (matchingCategory) {
        const categoryRecs = recommendationsByCategory[matchingCategory];
        personalized = [...personalized, ...categoryRecs];
      }
    });
    
    // If no matches found, add some general recommendations
    if (personalized.length === 0) {
      personalized = [
        { 
          name: 'Central Park Coffee', 
          category: 'Café', 
          description: 'Cozy café with outdoor seating and specialty coffee.',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60',
          rating: 4.8,
          distance: '0.8 miles'
        },
        { 
          name: 'Community Center', 
          category: 'Entertainment', 
          description: 'Various activities and events for all interests.',
          image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60',
          rating: 4.5,
          distance: '1.2 miles'
        }
      ];
    }
    
    // Remove duplicates (in case multiple interests match the same category)
    const uniqueRecommendations = personalized.filter((rec, index, self) => 
      index === self.findIndex(r => r.name === rec.name)
    );
    
    // Limit to 5 recommendations
    return uniqueRecommendations.slice(0, 5);
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return [];
  }
};

/**
 * Get recommendations for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of recommendation objects
 */
export const getUserRecommendations = async (userId) => {
  try {
    // Get user profile with interests
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('interests')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (!profile || !profile.interests) {
      console.log('No interests found for user');
      return [];
    }
    
    // Generate personalized recommendations based on interests
    return await getPersonalizedRecommendations(profile.interests);
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return [];
  }
}; 