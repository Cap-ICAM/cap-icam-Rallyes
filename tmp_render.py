# -*- coding: utf-8 -*-
"""
Created on Mon Apr 11 11:21:54 2022

@author: hamidat
"""
from PIL import Image
import numpy as np

# Use the full file path for PIL and text file.
filin = open("last_image.txt", "r")
rows=int(filin.__iter__().__next__())
cols=int(filin.__iter__().__next__())

# Create a 2 dimensional list using rows and cols
# write here
matrix = []
arr = matrix  # Assigne 'matrix' à 'arr' pour que les variables de test fonctionnent plus bas


# Fill in the double loop in order to fill the matrix
for y in range(rows):
    # write here
    row = []
    for x in range(cols):
         # write here
         # On lit la ligne suivante du fichier et on la convertit en entier
         row.append(int(filin.__iter__().__next__()))
    matrix.append(row)


# TEST if it is ok    -->just check
print(arr[2][1])    

# Close the file 'last_image.txt'
# write here
filin.close()


# Find the minimum of the matrix below, store it inside the variable min
# write here
min = np.min(matrix)


# Find the maximum of the matrix below, store it inside the variable max
# write here
max = np.max(matrix)


# TEST check the max and min values -->just check
print("max is: ",max," min is: ", min)


# compute the equation parameters (see https://www.google.com/search?q=Calculates+the+linear+equation+given+two+points)
# Équation d'une droite de type y = ax + b pour ramener les valeurs entre 0 et 255.
a = float( ( 255.0 / (max - min) ) ) 
b = -a * min


# Create a B&W image with the good size and load it
# write here
# 'L' signifie mode Luminance (Niveaux de gris). PIL utilise (largeur, hauteur), donc (cols, rows).
new_image = Image.new('L', (cols, rows))
pixels = new_image.load()


# Fill in the image pixel by pixel
for y in range(len(arr)):
    for x in range(len(arr[0])):
        # write here
        # On applique la formule linéaire calculée précédemment
        pixels[x, y] = int(a * arr[y][x] + b)

new_image.save('foo.png', 'png')
