package com.taobao.weex;

import android.graphics.Bitmap;
import android.graphics.Point;

/**
 * Created by albert on 4/26/16.
 */
public interface IWXImageLoaderListener {
    void onImageSizeLoaded(Point size);
    void onImageLoadFailed();
}