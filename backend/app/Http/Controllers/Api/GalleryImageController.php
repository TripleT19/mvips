<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryImageController extends Controller
{
    public function destroy(
        Request $request,
        GalleryImage $galleryImage
    ) {
        $galleryImage->load('gallery');

        /*
        |--------------------------------------------------------------------------
        | Prevent removing the final image
        |--------------------------------------------------------------------------
        */

        $imageCount = $galleryImage->gallery
            ->images()
            ->count();

        if ($imageCount <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'A gallery must contain at least one image.',
            ], 422);
        }

        if ($galleryImage->image_path) {
            Storage::disk('public')->delete(
                $galleryImage->image_path
            );
        }

        $galleryId = $galleryImage->gallery_id;

        $galleryImage->delete();

        /*
        |--------------------------------------------------------------------------
        | Re-number remaining images
        |--------------------------------------------------------------------------
        */

        $remaining = GalleryImage::where(
            'gallery_id',
            $galleryId
        )
            ->orderBy('sort_order')
            ->get();

        foreach ($remaining as $index => $image) {
            $image->update([
                'sort_order' => $index,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Image removed successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER IMAGES
    |--------------------------------------------------------------------------
    */

    public function reorder(
        Request $request
    ) {
        $validated = $request->validate([
            'images' => [
                'required',
                'array',
            ],

            'images.*.id' => [
                'required',
                'integer',
                'exists:gallery_images,id',
            ],

            'images.*.sort_order' => [
                'required',
                'integer',
                'min:0',
            ],
        ]);

        foreach ($validated['images'] as $image) {
            GalleryImage::where(
                'id',
                $image['id']
            )->update([
                'sort_order' => $image['sort_order'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Gallery images reordered successfully.',
        ]);
    }
}