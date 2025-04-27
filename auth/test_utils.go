package main

import (
	"errors"
	"fmt"
	"math/rand"

	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func generateRandowEmails() string {
	b := make([]byte, 5)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[rand.Intn(36)]
	}
	return fmt.Sprintf("%s@test.com", string(b))
}

func generateCommon(role string) Common {
	password, _ := bcrypt.GenerateFromPassword([]byte("nOTsOsAFEpaSSwORD"), bcrypt.DefaultCost)
	return Common{
		ID:           bson.NewObjectID(),
		Name:         generateRandowName(),
		Address:      generateRandomAddress(),
		Email:        generateRandowEmails(),
		PasswordHash: string(password),
		Role:         role,
	}
}

func generateUser(n, m int) *User {
	common := generateCommon("user")
	return &User{
		Common:       common,
		SavedRecipes: generateRecipesArray(n, m),
		Carts:        generateCartsArray(n, m),
		Orders:       generateUserOrdersArray(n, m),
	}
}

func generateVendor(n, m int) *Vendor {
	common := generateCommon("vendor")
	return &Vendor{
		Common: common,
	}
}

func generateRandowName() string {
	b := make([]byte, 5)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz"[rand.Intn(26)]
	}
	return fmt.Sprintf("%s tester", string(b))
}

func generateIngredientsArray(n int) []*Ingredient {
	genRandIngredient := func() string {

		vegetables := []string{
			"Tomato", "Onion", "Garlic", "Bell Pepper", "Carrot", "Broccoli",
			"Spinach", "Kale", "Cucumber", "Zucchini", "Mushroom", "Potato",
			"Sweet Potato", "Eggplant", "Cauliflower", "Asparagus", "Green Bean",
			"Corn", "Peas", "Leek", "Celery", "Cabbage", "Brussels Sprout",
		}
		proteins := []string{
			"Chicken Breast", "Beef", "Pork", "Tofu", "Tempeh", "Salmon",
			"Tuna", "Shrimp", "Lentils", "Chickpeas", "Black Beans", "Ground Turkey",
			"Lamb", "Eggs", "Bacon", "Sausage", "Ham", "Duck", "Crab Meat",
			"Lobster", "Scallops", "Almonds", "Walnuts", "Peanuts", "Cashews",
		}
		grains := []string{
			"Rice", "Pasta", "Quinoa", "Couscous", "Barley", "Oats",
			"Bread Crumbs", "Flour", "Cornmeal", "Tortilla", "Noodles", "Pita Bread",
			"Bulgur Wheat", "Farro", "Polenta", "Millet", "Wild Rice", "Brown Rice",
		}
		dairy := []string{
			"Milk", "Butter", "Cheese", "Yogurt", "Cream", "Sour Cream",
			"Cream Cheese", "Mozzarella", "Parmesan", "Cheddar", "Goat Cheese", "Feta",
			"Ricotta", "Mascarpone", "Brie", "Blue Cheese", "Heavy Cream", "Buttermilk",
		}
		spices := []string{
			"Salt", "Pepper", "Cumin", "Paprika", "Cinnamon", "Oregano",
			"Basil", "Thyme", "Rosemary", "Chili Powder", "Ginger", "Turmeric",
			"Nutmeg", "Cardamom", "Cloves", "Bay Leaf", "Curry Powder", "Coriander",
			"Mustard Seed", "Saffron", "Fennel Seed", "Allspice", "Vanilla",
		}
		fruits := []string{
			"Lemon", "Lime", "Orange", "Apple", "Pear", "Banana",
			"Strawberry", "Blueberry", "Raspberry", "Mango", "Pineapple", "Coconut",
			"Avocado", "Cherry", "Watermelon", "Grape", "Pomegranate", "Fig",
			"Dates", "Raisins", "Cranberry", "Grapefruit", "Peach", "Plum",
		}
		oils := []string{
			"Olive Oil", "Vegetable Oil", "Canola Oil", "Sesame Oil", "Coconut Oil",
			"Peanut Oil", "Sunflower Oil", "Grapeseed Oil", "Avocado Oil", "Walnut Oil",
		}

		allIngredients := []string{}
		allIngredients = append(allIngredients, vegetables...)
		allIngredients = append(allIngredients, proteins...)
		allIngredients = append(allIngredients, grains...)
		allIngredients = append(allIngredients, dairy...)
		allIngredients = append(allIngredients, spices...)
		allIngredients = append(allIngredients, fruits...)
		allIngredients = append(allIngredients, oils...)

		return allIngredients[rand.Intn(len(allIngredients))]
	}

	res := make([]*Ingredient, n)
	for i := range n {
		res[i] = &Ingredient{
			IngredientID: bson.NewObjectID(),
			Name:         genRandIngredient(),
			Unit:         []string{"kg", "g", "mg", "litre", "ml"}[rand.Intn(5)],
			Price:        (rand.Float64() + 1) * 1000,
		}
	}
	return res
}

func generateItemsArray(n int) []*Item {
	res := make([]*Item, n)
	ingredients := generateIngredientsArray(n)
	for i := range n {
		res[i] = &Item{
			Ingredient: *ingredients[i],
			Quantity:   rand.Intn(100) + 1,
		}
	}
	return res
}

func generateRecipesArray(n, m int) []*Recipe {
	generateRandomTitle := func() string {

		adjectives := []string{
			"Homemade", "Classic", "Spicy", "Savory", "Sweet", "Tangy", "Creamy",
			"Crispy", "Roasted", "Grilled", "Baked", "Slow-Cooked", "Pan-Fried",
			"Sautéed", "Hearty", "Fresh", "Traditional", "Zesty", "Gourmet", "Quick",
			"Ultimate", "Easy", "Rustic", "Family-Style", "Seasonal", "Wholesome",
		}
		dishTypes := []string{
			"Pasta", "Soup", "Stew", "Salad", "Casserole", "Stir-Fry", "Curry",
			"Tacos", "Burgers", "Pizza", "Sandwich", "Risotto", "Pilaf", "Bowl",
			"Bake", "Skillet", "Noodles", "Chili", "Pie", "Roast", "Dumplings",
			"Grill", "Paella", "Frittata", "Meatballs", "Lasagna", "Pot Pie",
		}
		cuisines := []string{
			"Italian", "Mexican", "Thai", "Indian", "Chinese", "Mediterranean",
			"French", "Japanese", "Korean", "Greek", "Moroccan", "Lebanese",
			"Spanish", "American", "Vietnamese", "Brazilian", "Turkish", "Cajun",
		}

		adjRandIndex := rand.Intn(len(adjectives))
		disRandIndex := rand.Intn(len(dishTypes))
		cuiRandIndex := rand.Intn(len(cuisines))

		return fmt.Sprintf("%s %s %s", adjectives[adjRandIndex], cuisines[cuiRandIndex], dishTypes[disRandIndex])

	}

	generateRandonDescription := func() string {
		intros := []string{
			"A delicious meal that's perfect for any occasion.",
			"This flavorful dish combines the best seasonal ingredients.",
			"An easy recipe that's sure to become a family favorite.",
			"A comforting dish that's ready in under 30 minutes.",
			"This recipe transforms simple ingredients into something spectacular.",
			"A hearty dish that's both nutritious and satisfying.",
			"This crowd-pleasing recipe is perfect for entertaining.",
			"A versatile dish that can be customized to your taste.",
			"This simple yet elegant dish is perfect for weeknight dinners.",
			"A colorful and nutritious meal that's full of flavor.",
			"This classic recipe has stood the test of time for good reason.",
			"A quick and easy meal that doesn't compromise on flavor.",
			"This impressive dish is surprisingly simple to prepare.",
		}
		methods := []string{
			"Slow-cooked to perfection, allowing the flavors to meld together beautifully.",
			"Made with fresh ingredients that create a burst of flavor in every bite.",
			"Prepared using a traditional technique that enhances the natural flavors.",
			"Cooked with care to ensure the perfect texture and taste balance.",
			"Seasoned with a carefully selected blend of herbs and spices.",
			"Featuring a unique combination of textures and complementary flavors.",
			"Created with simplicity in mind, letting the quality ingredients shine.",
			"Balanced with sweet, savory, and aromatic elements that work in harmony.",
			"Finished with a special touch that elevates this dish to the next level.",
		}
		serving := []string{
			"Serve hot with your favorite side for a complete meal.",
			"Perfect for sharing with friends and family.",
			"Enjoy with a glass of wine for the ultimate dining experience.",
			"Garnish with fresh herbs just before serving for added flavor.",
			"Can be prepared ahead of time and reheated when needed.",
			"Leftovers taste even better the next day as flavors continue to develop.",
			"Pairs wonderfully with a crisp salad or crusty bread.",
			"Makes excellent leftovers for lunch the following day.",
			"Great for meal prep and can be frozen for future meals.",
		}

		randIntro := rand.Intn(len(intros))
		randMethods := rand.Intn(len(methods))
		randServing := rand.Intn(len(serving))

		return fmt.Sprintf("%s %s %s", intros[randIntro], methods[randMethods], serving[randServing])
	}
	res := make([]*Recipe, n)
	for i := range n {
		res[i] = &Recipe{
			ID:              bson.NewObjectID(),
			Title:           generateRandomTitle(),
			Items:           generateItemsArray(m),
			Description:     generateRandonDescription(),
			PreparationTime: rand.Intn(10) + 1,
			ServingSize:     rand.Intn(10) + 1,
		}

	}
	return res
}

func generateRandomAddress() string {
	streetNames := []string{"Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington", "Lake", "Hill",
		"Park", "River", "Meadow", "Forest", "Spring", "Sunset", "Highland", "Valley", "Mountain"}

	streetTypes := []string{"St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Way", "Pl", "Ct"}

	cities := []string{"Springfield", "Franklin", "Greenville", "Bristol", "Clinton", "Salem",
		"Georgetown", "Arlington", "Burlington", "Manchester", "Oxford", "Riverside", "Kingston"}

	states := []string{"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
		"IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
		"NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
		"UT", "VT", "VA", "WA", "WV", "WI", "WY"}

	countries := []string{"USA", "Chile", "China", "India", "Mexico", "Australia"}

	a := &struct {
		StreetNumber string
		StreetName   string
		StreetType   string
		City         string
		State        string
		ZipCode      string
		Country      string
	}{
		StreetNumber: fmt.Sprintf("%d", rand.Intn(9999)+1),
		StreetName:   streetNames[rand.Intn(len(streetNames))],
		StreetType:   streetTypes[rand.Intn(len(streetTypes))],
		City:         cities[rand.Intn(len(cities))],
		State:        states[rand.Intn(len(states))],
		ZipCode:      fmt.Sprintf("%05d", rand.Intn(100000)),
		Country:      countries[rand.Intn(len(countries))],
	}

	return fmt.Sprintf("%s %s %s, %s, %s %s, %s",
		a.StreetNumber, a.StreetName, a.StreetType,
		a.City, a.State, a.ZipCode, a.Country)
}

func generateCartsArray(n, m int) []*Cart {
	carts := make([]*Cart, n)
	for i := range n {
		carts[i] = &Cart{
			ID:         bson.NewObjectID(),
			VendorID:   bson.NewObjectID(),
			StoreID:    bson.NewObjectID(),
			TotalPrice: (rand.Float64() + 1) * 1000,
			Items:      generateItemsArray(m),
		}
	}
	return carts
}

func generateOrdersArray(n, m int) []*Order {
	orders := make([]*Order, n)
	for i := range n {
		orders[i] = &Order{
			ID:             bson.NewObjectID(),
			StoreID:        bson.NewObjectID(),
			DeliveryMethod: "Deliver",
			OrderStatus:    "pending",
			TotalPrice:     (rand.Float64() + 1) * 1000,
			Items:          generateItemsArray(m),
		}
	}
	return orders
}

func generateUserOrdersArray(n, m int) []*UserOrder {
	userOrders := make([]*UserOrder, n)
	orders := generateOrdersArray(n, m)
	for i := range n {
		userOrders[i] = &UserOrder{
			Order:         *orders[i],
			VendorID:      bson.NewObjectID(),
			PaymentStatus: "success",
		}
	}
	return userOrders
}

func checkUserStruct(in, out *User) error {
	if in.ID.Hex() != out.ID.Hex() {
		return fmt.Errorf("UserID Mismatch %v vs %v", in.ID, out.ID)
	}
	if in.UserName != out.UserName {
		return fmt.Errorf("UserName mismatch: %s vs %s", in.UserName, out.UserName)
	}
	if in.UserAddress != out.UserAddress {
		return fmt.Errorf("UserAddress mismatch -> \n%s\n%s", in.UserAddress, out.UserAddress)
	}
	if in.Email != out.Email {
		return fmt.Errorf("Email mismatch: %s vs %s", in.Email, out.Email)
	}
	if in.PasswordHash != out.PasswordHash {
		return fmt.Errorf("PasswordHash mismatch: %s vs %s", in.PasswordHash, out.PasswordHash)
	}
	if in.Role != out.Role {
		return fmt.Errorf("Role mismatch: %s vs %s", in.Role, out.Role)
	}

	inRecipeLen, outRecipeLen := len(in.SavedRecipes), len(out.SavedRecipes)
	if inRecipeLen != outRecipeLen {
		return fmt.Errorf("Recipe Length mismatch: %d vs %d", inRecipeLen, outRecipeLen)
	}

	for i, inRecipe := range in.SavedRecipes {
		outRecipe := out.SavedRecipes[i]
		if err := checkRecipe(inRecipe, outRecipe); err != nil {
			return errors.Join(fmt.Errorf("Error at recipes index -> %d", i), err)
		}
	}

	return nil
}

func checkRecipes(in, out []*Recipe) error {

	inLen, outLen := len(in), len(out)
	if inLen != outLen {
		return fmt.Errorf("Recipe Length mismatch: %d vs %d", inLen, outLen)
	}

	for i, inRecipe := range in {
		outRecipe := out[i]
		if err := checkRecipe(inRecipe, outRecipe); err != nil {
			return errors.Join(fmt.Errorf("Error at recipes index -> %d", i), err)
		}
	}
	return nil
}

func checkRecipe(in, out *Recipe) error {
	if in == nil && out == nil {
		return fmt.Errorf("Both recipes are nil")
	}
	if in == nil || out == nil {
		return fmt.Errorf("In nil ? -> %t Out nil ? -> %t", in == nil, out == nil)
	}
	if in.ID.Hex() != out.ID.Hex() {
		return fmt.Errorf("ID mismatch: %v vs %v", in.ID, out.ID)
	}
	if in.Title != out.Title {
		return fmt.Errorf("Title mismatch: %s vs %s", in.Title, out.Title)
	}
	if in.Description != out.Description {
		return fmt.Errorf("Description mismatch: %s vs %s", in.Description, out.Description)
	}
	if in.PreparationTime != out.PreparationTime {
		return fmt.Errorf("PreparationTime mismatch: %d vs %d", in.PreparationTime, out.PreparationTime)
	}
	if in.ServingSize != out.ServingSize {
		return fmt.Errorf("ServingSize mismatch: %d vs %d", in.ServingSize, out.ServingSize)
	}

	inIgLen, outIgLen := len(in.Ingredients), len(out.Ingredients)
	if inIgLen != outIgLen {
		return fmt.Errorf("Ingredients Length mismatch: %d vs %d", inIgLen, outIgLen)
	}

	for i, inIg := range in.Ingredients {
		outIg := out.Ingredients[i]
		if err := checkIngredient(inIg, outIg); err != nil {
			return errors.Join(fmt.Errorf("Error at Ingredient index -> %d", i), err)
		}
	}

	return nil
}

func checkIngredient(in, out *Ingredient) error {
	if in == nil && out == nil {
		return fmt.Errorf("Both ingredients struct are nil")
	}
	if in == nil || out == nil {
		return fmt.Errorf("In nil ? -> %t Out nil ? -> %t", in == nil, out == nil)
	}
	if in.IngredientID.Hex() != out.IngredientID.Hex() {
		return fmt.Errorf("IngredientID mismatch: %v vs %v", in.IngredientID, out.IngredientID)
	}
	if in.Name != out.Name {
		return fmt.Errorf("Name mismatch: %s vs %s", in.Name, out.Name)
	}

	if in.Quantity != out.Quantity {
		return fmt.Errorf("Quantity mismatch: %f vs %f", in.Quantity, out.Quantity)
	}
	if in.Unit != out.Unit {
		return fmt.Errorf("Unit mismatch: %s vs %s", in.Unit, out.Unit)
	}
	return nil
}
