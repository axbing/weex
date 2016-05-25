package com.alibaba.weex.extend;

import android.graphics.Bitmap;
import android.graphics.Point;
import android.graphics.drawable.Drawable;
import android.text.TextUtils;
import android.widget.ImageView;

import com.squareup.picasso.Picasso;
import com.squareup.picasso.RequestCreator;
import com.squareup.picasso.Target;
import com.taobao.weex.IWXImageLoaderListener;
import com.taobao.weex.WXEnvironment;
import com.taobao.weex.WXSDKManager;
import com.taobao.weex.adapter.IWXImgLoaderAdapter;
import com.taobao.weex.common.WXImageStrategy;
import com.taobao.weex.dom.WXImageQuality;

import java.util.HashSet;

public class ImageAdapter implements IWXImgLoaderAdapter {

  // not thread safe
  private HashSet<Target> m_list = new  HashSet<Target>();

  public ImageAdapter() {
  }

  @Override
  public void setImage(final String url, final ImageView view,
                       WXImageQuality quality, WXImageStrategy strategy, final IWXImageLoaderListener listener) {
    //        if (TextUtils.isEmpty(url)) {
    //            view.setImageBitmap(null);
    //            return;
    //        }
    //        String temp = url;
    //        if (url.startsWith("//")){
    //            temp = "http:" + url;
    //        }
    //
    //        Uri uri = Uri.parse(temp);
    //
    //        ImageDecodeOptions decodeOptions = ImageDecodeOptions.newBuilder()
    //                .setBackgroundColor(Color.GREEN)
    //                .build();
    //
    //        ImageRequest request = ImageRequestBuilder
    //                .newBuilderWithSource(uri)
    //                .setImageDecodeOptions(decodeOptions)
    //                .setAutoRotateEnabled(true)
    //                .setLocalThumbnailPreviewsEnabled(true)
    //                .setLowestPermittedRequestLevel(ImageRequest.RequestLevel.FULL_FETCH)
    //                .setProgressiveRenderingEnabled(false)
    //                .build();
    //
    //
    //        ImagePipeline imagePipeline = Fresco.getImagePipeline();
    //        DataSource<CloseableReference<CloseableImage>>
    //                dataSource = imagePipeline.fetchDecodedImage(request, mContext);
    //
    //        DataSubscriber dataSubscriber =
    //                new BaseDataSubscriber<CloseableReference<CloseableImage>>() {
    //                    @Override
    //                    public void onNewResultImpl(DataSource<CloseableReference<CloseableImage>> dataSource) {
    //
    //                        CloseableReference<CloseableImage> imageReference = dataSource.getResult();
    //                        if (imageReference != null) {
    //                            try {
    //                                // do something with the image
    //                                Preconditions.checkState(CloseableReference.isValid(imageReference));
    //                                CloseableImage closeableImage = imageReference.get();
    //                                if (closeableImage instanceof CloseableStaticBitmap) {
    //                                    CloseableStaticBitmap closeableStaticBitmap = (CloseableStaticBitmap) closeableImage;
    //                                    view.setImageBitmap(closeableStaticBitmap.getUnderlyingBitmap());
    ////                                    boolean hasResult =  null != closeableStaticBitmap.getUnderlyingBitmap();
    //                                } else {
    //                                    throw new UnsupportedOperationException("Unrecognized image class: " + closeableImage);
    //                                }
    //                            } finally {
    //                                imageReference.close();
    //                            }
    //                        }
    //                    }
    //
    //                    @Override
    //                    public void onFailureImpl(DataSource dataSource) {
    //                        Throwable throwable = dataSource.getFailureCause();
    //                        // handle failure
    //                    }
    //                };
    //
    //        dataSource.subscribe(dataSubscriber, UiThreadImmediateExecutorService.getInstance());

    WXSDKManager.getInstance().postOnUiThread(new Runnable() {

      @Override
      public void run() {
        if (TextUtils.isEmpty(url)) {
          Picasso.with(WXEnvironment.getApplication()).cancelRequest(view);
          view.setImageBitmap(null);
          return;
        }
        String temp = url;
        if (url.startsWith("//")) {
          temp = "http:" + url;
        }
        if (view.getLayoutParams().width <= 0 || view.getLayoutParams().height <= 0) {
          Target target = new WXimageTarget(view, listener);
          // later, in the path, just decode width and height.
          Picasso.with(WXEnvironment.getApplication())
                  .load(temp)
                  .into(target);
          if (m_list.size() > 100)
            m_list.clear();
          m_list.add(target);
          return;
        }
        Picasso.with(WXEnvironment.getApplication())
            .load(temp)
            .into(view);
      }
    },0);
  }

  private class WXimageTarget implements  com.squareup.picasso.Target {
    ImageView mView;
    IWXImageLoaderListener m_listener;

    WXimageTarget(ImageView view, IWXImageLoaderListener listener) {
      m_listener = listener;
    }

    @Override
    public void onBitmapLoaded(Bitmap bitmap, Picasso.LoadedFrom from) {
      if (m_listener != null)
        m_listener.onImageSizeLoaded(new Point(bitmap.getWidth(), bitmap.getHeight()));
      ImageAdapter.this.m_list.remove(this);
    };

    @Override
    public void onBitmapFailed(Drawable errorDrawable) {
      ImageAdapter.this.m_list.remove(this);
    };

    @Override
    public void onPrepareLoad(Drawable placeHolderDrawable) { };

  }
}
