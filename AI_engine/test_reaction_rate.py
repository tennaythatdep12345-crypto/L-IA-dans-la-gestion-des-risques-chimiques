from utils.reaction_rate_calculator import calculate_environmental_risk_factors

# Test at 100°C and 50% humidity
result = calculate_environmental_risk_factors(100, 50)
print("Temperature: 100°C, Humidity: 50%")
print(f"Reaction Rate Multiplier: {result['reaction_rate_multiplier']}")
print(f"Risk Adjustment Score: {result['risk_adjustment_score']} points")
print(f"Risk Level: {result['risk_level']}")
print(f"Warnings: {result['warnings']}")
