from flask import Flask, render_template
from flask_restful import reqparse, abort, Api, Resource
import json
from datetime import date, datetime

app = Flask(__name__)
api = Api(app)
app.config['TEMPLATES_AUTO_RELOAD'] = True

parser = reqparse.RequestParser()

cat_arr = []
parser.add_argument('cat_id')

purch_arr = []
parser.add_argument('purchase_id')


@app.route("/")
def home():
    return render_template("home.html")


class Category(Resource):
    def get(self, cat_id):
        if not any(cat['cat_id'] == int(cat_id) for cat in cat_arr):
            abort(404)
        return cat_arr[cat_id]

    def delete(self, cat_id):
        if not any(cat['cat_id'] == int(cat_id) for cat in cat_arr):
            abort(404)
        cat = [c for c in cat_arr if c['cat_id'] == int(cat_id)]
        for p in purch_arr:
            if p['cat'] == cat[0]['name']:
                p.update({'cat': ""})

        cat_arr[:] = [cat for cat in cat_arr if cat['cat_id'] != int(cat_id)]

        return json.dumps("Category successfully deleted!"), 204


class Categories(Resource):
    def get(self):
        a = []
        for i in cat_arr:
            a.append(i)
        return json.dumps(a), 200

    def post(self):
        parser.add_argument('name')
        parser.add_argument('limit')
        args = parser.parse_args()
        new_cat = {}
        # Generate id for new category
        if [cat['cat_id'] for cat in cat_arr]:
            new_cat['cat_id'] = max([cat['cat_id'] for cat in cat_arr]) + 1
        else:
            new_cat['cat_id'] = 1
        # Check if category already exists
        # Add new category if it doesn't already exist
        if not any(n['name'] == args['name'] for n in cat_arr):
            new_cat['name'] = args['name']
            new_cat['limit'] = int(args['limit'])
            cat_arr.append(new_cat)
        return cat_arr[len([cat for cat in cat_arr if cat]) - 1], 201


class Purchase(Resource):
    def get(self, purchase_id):
        if not any(purch['purchase_id'] == int(purchase_id) for purch in purch_arr):
            abort(404)
        return purch_arr[purchase_id]

    def delete(self, purchase_id):
        if not any(purch['purchase_id'] == int(purchase_id) for purch in purch_arr):
            abort(404)

        purch_arr[:] = [
            purch for purch in purch_arr if purch['purchase_id'] != int(purchase_id)]
        return json.dumps("Purchase successfully deleted!"), 204


class Purchases(Resource):
    def get(self):
        today_date = datetime.now()
        today_month = today_date.month
        today_year = today_date.year
        a = []
        # Check the array for only purchases made in the current month
        for i in purch_arr:
            dateString = str(i['date']).split("-")
            dateObj = date(int(dateString[0]), int(
                dateString[1]), int(dateString[2]))
            if today_month == dateObj.month and today_year == dateObj.year:
                a.append(i)
        return json.dumps(a), 200

    def post(self):
        parser.add_argument('name')
        parser.add_argument('cost')
        parser.add_argument('cat')
        parser.add_argument('date')
        args = parser.parse_args()

        new_purchase = {}
        # Generate id for new purchase
        if [purch['purchase_id'] for purch in purch_arr]:
            new_purchase['purchase_id'] = max(
                [purch['purchase_id'] for purch in purch_arr]) + 1
        else:
            new_purchase['purchase_id'] = 1
        new_purchase['name'] = args['name']
        new_purchase['cost'] = float(args['cost'])
        new_purchase['cat'] = args['cat']
        new_purchase['date'] = args['date']
        purch_arr.append(new_purchase)
        return purch_arr[len([purch for purch in purch_arr if purch]) - 1], 201


api.add_resource(Category, '/categories/<cat_id>')
api.add_resource(Categories, '/categories')
api.add_resource(Purchase, '/purchases/<purchase_id>')
api.add_resource(Purchases, '/purchases')

if __name__ == '__main__':
    app.run(debug=True)
