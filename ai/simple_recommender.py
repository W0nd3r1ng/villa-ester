import json
import re
import sys
from datetime import datetime
from collections import Counter

class SimpleCottageRecommender:
    def __init__(self):
        self.cottages = []
        self.bookings = []
        self.reviews = []
        
    def load_data(self, cottages_data, bookings_data, reviews_data):
        """Load data from the resort system"""
        self.cottages = cottages_data
        self.bookings = bookings_data
        self.reviews = reviews_data
        
    def analyze_best_sellers(self):
        """Find the most booked cottages"""
        if not self.bookings:
            return {}
            
        cottage_bookings = Counter()
        for booking in self.bookings:
            if booking.get('status') in ['confirmed', 'completed']:
                cottage_id = booking.get('cottageId')
                cottage_bookings[cottage_id] += 1
                
        return dict(cottage_bookings.most_common())
    
    def analyze_ratings(self):
        """Find the highest rated cottages"""
        if not self.reviews:
            return {}
            
        cottage_ratings = {}
        cottage_review_counts = {}
        
        for review in self.reviews:
            cottage_id = review.get('cottageId')
            rating = review.get('rating', 0)
            
            if cottage_id not in cottage_ratings:
                cottage_ratings[cottage_id] = 0
                cottage_review_counts[cottage_id] = 0
                
            cottage_ratings[cottage_id] += rating
            cottage_review_counts[cottage_id] += 1
        
        # Calculate average ratings
        avg_ratings = {}
        for cottage_id in cottage_ratings:
            if cottage_review_counts[cottage_id] > 0:
                avg_ratings[cottage_id] = cottage_ratings[cottage_id] / cottage_review_counts[cottage_id]
                
        return avg_ratings
    
    def analyze_guest_count(self, guest_count):
        """Find cottages that best match the guest count"""
        suitable_cottages = []
        
        for cottage in self.cottages:
            capacity_str = cottage.get('capacity', '')
            # Extract numbers from capacity string (e.g., "2-4 people" -> [2, 4])
            numbers = re.findall(r'\d+', capacity_str)
            
            if numbers:
                min_capacity = int(numbers[0])
                max_capacity = int(numbers[-1]) if len(numbers) > 1 else min_capacity
                
                # Check if guest count fits within capacity
                if min_capacity <= guest_count <= max_capacity:
                    suitable_cottages.append({
                        'cottage_id': cottage.get('_id'),
                        'name': cottage.get('name'),
                        'capacity': capacity_str,
                        'fit_score': 1 - abs(guest_count - (min_capacity + max_capacity) / 2) / max_capacity
                    })
        
        # Sort by fit score (best fit first)
        suitable_cottages.sort(key=lambda x: x['fit_score'], reverse=True)
        return suitable_cottages
    
    def detect_special_notes(self, special_requests):
        """Detect special occasions that might warrant specific recommendations"""
        if not special_requests:
            return []
            
        special_requests_lower = special_requests.lower()
        special_occasions = []
        
        # Birthday detection
        birthday_keywords = ['birthday', 'birth day', 'bday', 'celebration']
        if any(keyword in special_requests_lower for keyword in birthday_keywords):
            special_occasions.append('birthday')
        
        # Anniversary detection
        anniversary_keywords = ['anniversary', 'wedding anniversary', 'celebration']
        if any(keyword in special_requests_lower for keyword in anniversary_keywords):
            special_occasions.append('anniversary')
        
        # Party detection
        party_keywords = ['party', 'celebration', 'gathering', 'event']
        if any(keyword in special_requests_lower for keyword in party_keywords):
            special_occasions.append('party')
        
        # Videoke detection
        videoke_keywords = ['videoke', 'karaoke', 'singing', 'music']
        if any(keyword in special_requests_lower for keyword in videoke_keywords):
            special_occasions.append('videoke')
            
        return special_occasions
    
    def recommend_cottages(self, guest_count, booking_date, special_requests=None, num_recommendations=3):
        """Main recommendation function"""
        try:
            # Get analysis results
            best_sellers = self.analyze_best_sellers()
            top_ratings = self.analyze_ratings()
            guest_fit = self.analyze_guest_count(guest_count)
            special_occasions = self.detect_special_notes(special_requests)
            
            # Create scoring system
            cottage_scores = {}
            
            # Score cottages based on different factors
            for cottage in self.cottages:
                cottage_id = cottage.get('_id')
                score = 0
                
                # Best seller score (0-30 points)
                if cottage_id in best_sellers:
                    max_bookings = max(best_sellers.values()) if best_sellers else 1
                    score += (best_sellers[cottage_id] / max_bookings) * 30
                
                # Rating score (0-25 points)
                if cottage_id in top_ratings:
                    score += (top_ratings[cottage_id] / 5) * 25
                
                # Guest count fit score (0-25 points)
                for fit_cottage in guest_fit:
                    if fit_cottage['cottage_id'] == cottage_id:
                        score += fit_cottage['fit_score'] * 25
                        break
                
                # Special occasion bonus (0-20 points)
                if special_occasions:
                    cottage_name_lower = cottage.get('name', '').lower()
                    cottage_desc_lower = cottage.get('description', '').lower()
                    
                    # VE cottage bonus for special occasions
                    if 've' in cottage_name_lower and special_occasions:
                        score += 20
                    
                    # Videoke bonus
                    if any(occasion in ['birthday', 'party', 'videoke'] for occasion in special_occasions):
                        if 'videoke' in cottage_desc_lower or 've' in cottage_name_lower:
                            score += 20
                
                cottage_scores[cottage_id] = {
                    'cottage': cottage,
                    'score': score,
                    'best_seller_rank': best_sellers.get(cottage_id, 0),
                    'rating': top_ratings.get(cottage_id, 0),
                    'guest_fit': next((fit for fit in guest_fit if fit['cottage_id'] == cottage_id), None)
                }
            
            # Sort by score and get top recommendations
            sorted_cottages = sorted(cottage_scores.items(), key=lambda x: x[1]['score'], reverse=True)
            
            recommendations = []
            for cottage_id, data in sorted_cottages[:num_recommendations]:
                cottage = data['cottage']
                recommendation = {
                    'cottage_id': cottage_id,
                    'name': cottage.get('name'),
                    'description': cottage.get('description'),
                    'price': cottage.get('price'),
                    'capacity': cottage.get('capacity'),
                    'image': cottage.get('image'),
                    'score': round(data['score'], 2),
                    'reasons': []
                }
                
                # Add reasons for recommendation
                if data['best_seller_rank'] > 0:
                    recommendation['reasons'].append(f"Popular choice - {data['best_seller_rank']} bookings")
                
                if data['rating'] > 0:
                    recommendation['reasons'].append(f"Highly rated - {data['rating']:.1f}/5 stars")
                
                if data['guest_fit']:
                    recommendation['reasons'].append(f"Perfect fit for {guest_count} guests")
                
                if special_occasions:
                    if 've' in cottage.get('name', '').lower():
                        recommendation['reasons'].append("Great for celebrations with videoke")
                    elif any(occasion in ['birthday', 'party'] for occasion in special_occasions):
                        recommendation['reasons'].append("Ideal for your special occasion")
                
                recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            print(f"Error in recommendation: {e}", file=sys.stderr)
            # Fallback to simple recommendations
            return self.get_fallback_recommendations(guest_count, special_occasions)
    
    def get_fallback_recommendations(self, guest_count, special_occasions):
        """Fallback recommendations when ML analysis fails"""
        recommendations = []
        
        # Simple logic based on guest count and special occasions
        if special_occasions and any(occasion in ['birthday', 'party', 'videoke'] for occasion in special_occasions):
            recommendations.append({
                'cottage_id': 'With Videoke',
                'name': 'VE Cottage with Videoke',
                'description': 'Perfect for celebrations with videoke system',
                'price': 2500,
                'capacity': '20-25 guests',
                'image': 'vecottage.jpg',
                'score': 95,
                'reasons': ['Perfect for celebrations', 'Includes videoke system', 'Great for large groups']
            })
        
        # Add other cottages based on guest count
        if guest_count <= 5:
            recommendations.append({
                'cottage_id': 'garden',
                'name': 'Garden Table',
                'description': 'Cozy garden setting perfect for small groups',
                'price': 300,
                'capacity': '5 guests',
                'image': 'gardentable.jpg',
                'score': 85,
                'reasons': ['Perfect for small groups', 'Great value', 'Garden setting']
            })
        elif guest_count <= 15:
            recommendations.append({
                'cottage_id': 'kubo',
                'name': 'Kubo Type',
                'description': 'Traditional kubo perfect for medium-sized groups',
                'price': 800,
                'capacity': '10-15 guests',
                'image': 'kubo.jpg',
                'score': 80,
                'reasons': ['Great for medium groups', 'Traditional setting', 'Comfortable space']
            })
        else:
            recommendations.append({
                'cottage_id': 'Without Videoke',
                'name': 'VE Cottage without Videoke',
                'description': 'Spacious cottage perfect for large groups',
                'price': 2000,
                'capacity': '20-25 guests',
                'image': 'vecottage.jpg',
                'score': 75,
                'reasons': ['Perfect for large groups', 'Spacious accommodation', 'Great value']
            })
        
        return recommendations[:3]

def main():
    """Main function to handle input from Node.js and return JSON output"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract parameters
        guest_count = input_data.get('guest_count', 2)
        booking_date = input_data.get('booking_date')
        special_requests = input_data.get('special_requests', '')
        cottages_data = input_data.get('cottages', [])
        bookings_data = input_data.get('bookings', [])
        reviews_data = input_data.get('reviews', [])
        
        # Create recommender and load data
        recommender = SimpleCottageRecommender()
        recommender.load_data(cottages_data, bookings_data, reviews_data)
        
        # Get recommendations
        recommendations = recommender.recommend_cottages(
            guest_count=guest_count,
            booking_date=booking_date,
            special_requests=special_requests
        )
        
        # Output JSON to stdout
        print(json.dumps(recommendations))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        # Return fallback recommendations
        recommender = SimpleCottageRecommender()
        fallback_recs = recommender.get_fallback_recommendations(
            input_data.get('guest_count', 2) if 'input_data' in locals() else 2,
            recommender.detect_special_notes(input_data.get('special_requests', '')) if 'input_data' in locals() else []
        )
        print(json.dumps(fallback_recs))

# Test the recommender when run directly
if __name__ == '__main__':
    # Check if we're being called from Node.js (with stdin data)
    if not sys.stdin.isatty():
        main()
    else:
        # Run test with sample data
        sample_cottages = [
            {
                '_id': 'With Videoke',
                'name': 'VE Cottage with Videoke',
                'description': 'Perfect for celebrations with videoke system',
                'price': 2500,
                'capacity': '20-25 guests',
                'image': 'vecottage.jpg',
                'type': 'Cottage'
            },
            {
                '_id': 'garden',
                'name': 'Garden Table',
                'description': 'Cozy garden setting perfect for small groups',
                'price': 300,
                'capacity': '5 guests',
                'image': 'gardentable.jpg',
                'type': 'Table'
            },
            {
                '_id': 'kubo',
                'name': 'Kubo Type',
                'description': 'Traditional kubo perfect for medium-sized groups',
                'price': 800,
                'capacity': '10-15 guests',
                'image': 'kubo.jpg',
                'type': 'Cottage'
            }
        ]
        
        sample_bookings = [
            {
                '_id': 'booking1',
                'cottageId': 'With Videoke',
                'status': 'confirmed',
                'numberOfPeople': 20
            },
            {
                '_id': 'booking2',
                'cottageId': 'garden',
                'status': 'completed',
                'numberOfPeople': 4
            }
        ]
        
        sample_reviews = [
            {
                '_id': 'review1',
                'cottageId': 'With Videoke',
                'rating': 5,
                'comment': 'Great for birthday parties!'
            },
            {
                '_id': 'review2',
                'cottageId': 'garden',
                'rating': 4,
                'comment': 'Perfect for small groups'
            }
        ]
        
        # Test the recommender
        recommender = SimpleCottageRecommender()
        recommender.load_data(sample_cottages, sample_bookings, sample_reviews)
        
        # Test with birthday request
        recommendations = recommender.recommend_cottages(
            guest_count=4,
            booking_date='2024-01-15',
            special_requests='Birthday celebration with videoke'
        )
        
        print("AI Recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec['name']} - Score: {rec['score']}")
            print(f"   Reasons: {', '.join(rec['reasons'])}")
            print() 