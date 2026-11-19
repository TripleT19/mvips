<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class GalleryImageController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DELETE A SINGLE GALLERY IMAGE
    |--------------------------------------------------------------------------
    | Route: DELETE /admin/gallery-images/{galleryImage}
    */

    public function destroy(GalleryImage $galleryImage)
    {
        if ($galleryImage->image_path) {
            Storage::disk('public')->delete($galleryImage->image_path);
        }

        $galleryImage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER IMAGES WITHIN A GALLERY
    |--------------------------------------------------------------------------
    | Route: POST /admin/gallery-images/reorder
    |
    | Accepts either of these payload shapes:
    |
    |   { "images": [ { "id": 5, "sort_order": 0 }, ... ] }
    |
    |   { "order": [12, 7, 3, 9] }   // ids in the desired order
    |
    | Both are common in the wild — supporting both makes the endpoint
    | forgiving against whichever the frontend already sends.
    */

    public function reorder(Request $request)
    {
        $request->validate([
            'images'           => ['required_without:order', 'array'],
            'images.*.id'      => ['required_with:images', 'integer', 'exists:gallery_images,id'],
            'images.*.sort_order' => ['required_with:images', 'integer', 'min:0'],

            'order'            => ['required_without:images', 'array'],
            'order.*'          => ['required_with:order', 'integer', 'exists:gallery_images,id'],
        ]);

        DB::transaction(function () use ($request) {
            if ($request->filled('images')) {
                foreach ($request->input('images') as $item) {
                    GalleryImage::whereKey($item['id'])
                        ->update(['sort_order' => $item['sort_order']]);
                }
                return;
            }

            foreach ($request->input('order', []) as $position => $id) {
                GalleryImage::whereKey($id)
                    ->update(['sort_order' => $position]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Images reordered successfully.',
        ]);
    }
}