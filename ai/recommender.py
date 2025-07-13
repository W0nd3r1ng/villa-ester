import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
from collections import Counter
import json

class CottageRecommender:
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
    
    def analyze_peak_season(self, target_date):
        """Analyze which cottages are popular during specific seasons"""
        if not self.bookings:
            return {}
            
        # Convert target date to month
        target_month = target_date.month
        
        # Group bookings by month and cottage
        monthly_bookings = {}
        for booking in self.bookings:
            if booking.get('status') in ['confirmed', 'completed']:
                booking_date = datetime.fromisoformat(booking.get('bookingDate').replace('Z', '+00:00'))
                month = booking_date.month
                cottage_id = booking.get('cottageId')
                
                if month not in monthly_bookings:
                    monthly_bookings[month] = Counter()
                monthly_bookings[month][cottage_id] += 1
        
        # Get popularity for target month
        if target_month in monthly_bookings:
            return dict(monthly_bookings[target_month].most_common())
        return {}
    
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
            # Parse booking date
            if isinstance(booking_date, str):
                booking_date = datetime.fromisoformat(booking_date.replace('Z', '+00:00'))
            
            # Get analysis results
            best_sellers = self.analyze_best_sellers()
            top_ratings = self.analyze_ratings()
            peak_season = self.analyze_peak_season(booking_date)
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
                
                # Peak season score (0-20 points)
                if cottage_id in peak_season:
                    max_season_bookings = max(peak_season.values()) if peak_season else 1
                    score += (peak_season[cottage_id] / max_season_bookings) * 20
                
                # Guest count fit score (0-25 points)
                for fit_cottage in guest_fit:
                    if fit_cottage['cottage_id'] == cottage_id:
                        score += fit_cottage['fit_score'] * 25
                        break
                
                # Special occasion bonus (0-10 points)
                if special_occasions:
                    cottage_name_lower = cottage.get('name', '').lower()
                    cottage_desc_lower = cottage.get('description', '').lower()
                    
                    # VE cottage bonus for special occasions
                    if 've' in cottage_name_lower and special_occasions:
                        score += 10
                    
                    # Videoke bonus
                    if any(occasion in ['birthday', 'party', 'videoke'] for occasion in special_occasions):
                        if 'videoke' in cottage_desc_lower or 've' in cottage_name_lower:
                            score += 10
                
                cottage_scores[cottage_id] = {
                    'cottage': cottage,
                    'score': score,
                    'best_seller_rank': best_sellers.get(cottage_id, 0),
                    'rating': top_ratings.get(cottage_id, 0),
                    'peak_season_popularity': peak_season.get(cottage_id, 0),
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
                
                if data['peak_season_popularity'] > 0:
                    recommendation['reasons'].append("Perfect for this season")
                
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
            print(f"Error in recommendation: {e}")
            # Fallback to simple recommendations
            return self.get_fallback_recommendations(guest_count, special_occasions)
    
    def get_fallback_recommendations(self, guest_count, special_occasions):
        """Fallback recommendations when ML analysis fails"""
        recommendations = []
        
        # Simple logic based on guest count and special occasions
        if special_occasions and any(occasion in ['birthday', 'party', 'videoke'] for occasion in special_occasions):
            recommendations.append({
                'cottage_id': 've_cottage',
                'name': 'VE Cottage',
                'description': 'Perfect for celebrations with videoke system',
                'price': 2500,
                'capacity': '4-6 people',
                'image': 'vecottage.jpg',
                'score': 95,
                'reasons': ['Perfect for celebrations', 'Includes videoke system']
            })
        
        # Add other cottages based on guest count
        if guest_count <= 2:
            recommendations.append({
                'cottage_id': 'room1',
                'name': 'Room 1',
                'description': 'Cozy room perfect for couples',
                'price': 1500,
                'capacity': '2 people',
                'image': 'room1.jpg',
                'score': 85,
                'reasons': ['Perfect for couples', 'Great value']
            })
        elif guest_count <= 4:
            recommendations.append({
                'cottage_id': 'room2',
                'name': 'Room 2',
                'description': 'Spacious room for small groups',
                'price': 2000,
                'capacity': '3-4 people',
                'image': 'room2.jpg',
                'score': 80,
                'reasons': ['Great for small groups', 'Comfortable space']
            })
        else:
            recommendations.append({
                'cottage_id': 'room3',
                'name': 'Room 3',
                'description': 'Large room for bigger groups',
                'price': 3000,
                'capacity': '5-8 people',
                'image': 'room3.jpg',
                'score': 75,
                'reasons': ['Perfect for large groups', 'Spacious accommodation']
            })
        
        return recommendations[:3]

# Flask app for API
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

recommender = CottageRecommender()

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        
        # Get parameters
        guest_count = data.get('guest_count', 2)
        booking_date = data.get('booking_date')
        special_requests = data.get('special_requests', '')
        
        # Load data from request (in real implementation, this would come from database)
        cottages_data = data.get('cottages', [])
        bookings_data = data.get('bookings', [])
        reviews_data = data.get('reviews', [])
        
        # Load data into recommender
        recommender.load_data(cottages_data, bookings_data, reviews_data)
        
        # Get recommendations
        recommendations = recommender.recommend_cottages(
            guest_count=guest_count,
            booking_date=booking_date,
            special_requests=special_requests
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'analysis': {
                'guest_count': guest_count,
                'special_occasions': recommender.detect_special_notes(special_requests),
                'booking_date': booking_date
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'recommendations': recommender.get_fallback_recommendations(
                data.get('guest_count', 2) if 'data' in locals() else 2,
                recommender.detect_special_notes(data.get('special_requests', '')) if 'data' in locals() else []
            )
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'cottage-recommender'})

if __name__ == '__main__':
    app.run(port=5001, debug=True) 